package com.trustgrowth.society;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.KeyEvent;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends Activity {
    private WebView webView;
    private BroadcastReceiver tokenReceiver;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Push whatever FCM token we currently have into the web
                // app's JS context so it can register the device for push
                // notifications (see src/utils/pushNotifications.ts).
                pushCurrentFcmToken();
            }
        });
        webView.setWebChromeClient(new WebChromeClient());

        // Load application URL or local asset
        webView.loadUrl("file:///android_asset/www/index.html");

        requestNotificationPermission();
        registerTokenReceiver();
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1001);
            }
        }
    }

    /** Listens for MyFirebaseMessagingService.onNewToken() while this Activity is alive. */
    private void registerTokenReceiver() {
        tokenReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String token = intent.getStringExtra("token");
                if (token != null) sendTokenToWebView(token);
            }
        };
        IntentFilter filter = new IntentFilter("com.trustgrowth.society.FCM_TOKEN_REFRESH");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(tokenReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(tokenReceiver, filter);
        }
    }

    private void pushCurrentFcmToken() {
        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
            if (task.isSuccessful() && task.getResult() != null) {
                sendTokenToWebView(task.getResult());
            }
        });
    }

    /** Hands the FCM token to the web app via window.__onNativeFcmToken(token). */
    private void sendTokenToWebView(String token) {
        if (webView == null) return;
        final String js = "window.__onNativeFcmToken && window.__onNativeFcmToken("
                + org.json.JSONObject.quote(token) + ");";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    @Override
    protected void onDestroy() {
        if (tokenReceiver != null) {
            try {
                unregisterReceiver(tokenReceiver);
            } catch (Exception ignored) {
            }
        }
        super.onDestroy();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
