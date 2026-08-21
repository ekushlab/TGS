package com.trustgrowth.society;

import android.Manifest;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationChannelCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.core.content.pm.ShortcutManagerCompat;
import androidx.core.graphics.drawable.IconCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * Receives every push sent by the admin-only "send-notification" Supabase
 * Edge Function and renders it as a Messenger-style Android notification
 * "bubble" (Android's native Bubbles API, Android 11+; falls back to a
 * normal high-priority notification on older devices, where the OS doesn't
 * support bubbles).
 *
 * The push is sent as a DATA-ONLY FCM message (no top-level "notification"
 * key) specifically so onMessageReceived() below always runs — in the
 * foreground AND in the background/killed state on most OEMs — instead of
 * the OS auto-displaying a plain default notification we don't control.
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String CHANNEL_ID = "tgs_notifications";

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        // MainActivity (if running) picks this up and upserts it into
        // Supabase via the WebView JS bridge. MainActivity also fetches the
        // current token itself on every page load, so a token that refreshes
        // while the app is closed is still picked up next launch.
        Intent intent = new Intent("com.trustgrowth.society.FCM_TOKEN_REFRESH");
        intent.putExtra("token", token);
        intent.setPackage(getPackageName());
        sendBroadcast(intent);
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Map<String, String> data = remoteMessage.getData();
        String title = data.containsKey("title") ? data.get("title") : "Trust Growth Society";
        String body = data.containsKey("body") ? data.get("body") : "";

        showBubbleNotification(title, body);
    }

    private void showBubbleNotification(String title, String body) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && ActivityCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            // User hasn't granted notification permission — nothing we can show.
            return;
        }

        NotificationManagerCompat nmCompat = NotificationManagerCompat.from(this);

        NotificationChannelCompat channel = new NotificationChannelCompat.Builder(
                CHANNEL_ID, NotificationManagerCompat.IMPORTANCE_HIGH)
                .setName("Notifications")
                .setDescription("Announcements from Trust Growth Society")
                .build();
        nmCompat.createNotificationChannel(channel);

        int notifId = (int) System.currentTimeMillis();
        String shortcutId = "tgs_bubble_" + notifId;

        Person person = new Person.Builder()
                .setName("Trust Growth Society")
                .setIcon(IconCompat.createWithResource(this, R.mipmap.ic_launcher))
                .setImportant(true)
                .build();

        Intent bubbleIntent = new Intent(this, BubbleActivity.class);
        bubbleIntent.putExtra("title", title);
        bubbleIntent.putExtra("body", body);

        PendingIntent bubblePendingIntent = PendingIntent.getActivity(
                this, notifId, bubbleIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);

        // A dynamic shortcut is required by the platform to display a
        // notification as a bubble on Android 11+.
        try {
            ShortcutInfoCompat shortcut = new ShortcutInfoCompat.Builder(this, shortcutId)
                    .setLongLived(true)
                    .setIntent(new Intent(this, BubbleActivity.class).setAction(Intent.ACTION_VIEW))
                    .setShortLabel(title)
                    .setIcon(IconCompat.createWithResource(this, R.mipmap.ic_launcher))
                    .setPerson(person)
                    .build();
            ShortcutManagerCompat.pushDynamicShortcut(this, shortcut);
        } catch (Exception ignored) {
            // Shortcut quota exceeded or unsupported — the notification
            // still shows below, just without the bubble on some devices.
        }

        NotificationCompat.BubbleMetadata bubbleMetadata =
                new NotificationCompat.BubbleMetadata.Builder(bubblePendingIntent,
                        IconCompat.createWithResource(this, R.mipmap.ic_launcher))
                        .setDesiredHeight(600)
                        .setAutoExpandBubble(true)
                        .setSuppressNotification(true)
                        .build();

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.MessagingStyle(person)
                        .addMessage(body, System.currentTimeMillis(), person))
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setShortcutId(shortcutId)
                .setBubbleMetadata(bubbleMetadata)
                .setContentIntent(bubblePendingIntent)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH);

        nmCompat.notify(notifId, builder.build());
    }
}
