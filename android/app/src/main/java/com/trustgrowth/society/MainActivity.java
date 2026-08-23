package com.trustgrowth.society;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.KeyEvent;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.firebase.messaging.FirebaseMessaging;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private WebView webView;
    private BroadcastReceiver tokenReceiver;

    /** Pending callback for an in-progress <input type="file"> picker (see onShowFileChooser). */
    private ValueCallback<Uri[]> filePathCallback;
    private static final int FILE_CHOOSER_REQUEST_CODE = 51426;

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
        // Handles every <input type="file"> in the web app (deposit/bank/
        // investment receipt attachments, member NID/document uploads, logo
        // and watermark image uploads, cloud-backup file restore, ...). A
        // bare WebChromeClient never launches the system file/photo picker
        // on Android WebView, so without this override every "Select file"
        // button in the app silently does nothing when tapped.
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams fileChooserParams
            ) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                    MainActivity.this.filePathCallback = null;
                }
                MainActivity.this.filePathCallback = callback;

                Intent intent;
                try {
                    intent = fileChooserParams.createIntent();
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    return false;
                }

                try {
                    startActivityForResult(
                            Intent.createChooser(intent, "ফাইল নির্বাচন করুন"),
                            FILE_CHOOSER_REQUEST_CODE
                    );
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        // Bridges native printing (PrintManager) and native file saving
        // (MediaStore Downloads) into the web app, since WebView does not
        // implement window.print() or blob-URL <a download> clicks on its
        // own. See src/utils/nativeBridge.ts on the web side.
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        // Load application URL or local asset
        webView.loadUrl("file:///android_asset/www/index.html");

        requestNotificationPermission();
        requestStoragePermissionIfNeeded();
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

    /**
     * WRITE_EXTERNAL_STORAGE is only needed (and only a real runtime
     * permission) below Android 10 — on Q+ we save through MediaStore's
     * Downloads collection instead, which needs no permission at all.
     */
    private void requestStoragePermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 1002);
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
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST_CODE) return;
        if (filePathCallback == null) return;

        Uri[] results = null;
        if (resultCode == Activity.RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                results = new Uri[count];
                for (int i = 0; i < count; i++) {
                    results[i] = data.getClipData().getItemAt(i).getUri();
                }
            } else if (data.getData() != null) {
                results = new Uri[]{data.getData()};
            }
        }
        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    /** Tells the web app whether the native print/download bridge exists. */
    private void notifyWebDownloadResult(String fileName, boolean success) {
        if (webView == null) return;
        final String js = "window.__onNativeFileSaved && window.__onNativeFileSaved("
                + org.json.JSONObject.quote(fileName) + ", " + success + ");";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    /**
     * Opens Android's native print dialog on the currently-loaded WebView
     * content (used for the "Print" button on the Reports & Downloads page,
     * since a plain window.print() call does nothing inside a WebView).
     */
    private void printCurrentPage() {
        try {
            PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
            if (printManager == null) return;
            String jobName = "TGS_Report_" + System.currentTimeMillis();
            PrintDocumentAdapter printAdapter = webView.createPrintDocumentAdapter(jobName);
            printManager.print(jobName, printAdapter, new PrintAttributes.Builder().build());
        } catch (Exception e) {
            Toast.makeText(this, "প্রিন্ট চালু করা যায়নি।", Toast.LENGTH_LONG).show();
        }
    }

    /**
     * Decodes a base64 (optionally data-URL-prefixed) payload from the web
     * app and writes it as a real file into the device's Downloads folder,
     * since WebView silently ignores <a download> clicks on blob: URLs.
     */
    private void saveBase64File(String base64Data, String fileName, String mimeType) {
        boolean success = false;
        try {
            String cleanBase64 = base64Data.contains(",")
                    ? base64Data.substring(base64Data.indexOf(',') + 1)
                    : base64Data;
            byte[] bytes = Base64.decode(cleanBase64, Base64.DEFAULT);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri != null) {
                    try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                        if (os != null) {
                            os.write(bytes);
                            success = true;
                        }
                    }
                }
            } else {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) downloadsDir.mkdirs();
                File file = new File(downloadsDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(file)) {
                    fos.write(bytes);
                    success = true;
                }
            }
        } catch (Exception e) {
            success = false;
        }

        final boolean finalSuccess = success;
        final String finalFileName = fileName;
        runOnUiThread(() -> Toast.makeText(
                MainActivity.this,
                finalSuccess ? ("ডাউনলোড সম্পন্ন হয়েছে: " + finalFileName) : "ডাউনলোড ব্যর্থ হয়েছে।",
                Toast.LENGTH_LONG
        ).show());
        notifyWebDownloadResult(finalFileName, finalSuccess);
    }

    /**
     * Exposed to the web app as window.AndroidBridge — see
     * src/utils/nativeBridge.ts for the JS-side detection + calls.
     */
    private class AndroidBridge {
        @JavascriptInterface
        public void printPage() {
            runOnUiThread(MainActivity.this::printCurrentPage);
        }

        @JavascriptInterface
        public void saveFile(String base64Data, String fileName, String mimeType) {
            // Runs on the WebView's JS-bridge thread, not the UI thread —
            // fine, since file I/O should not block the UI/JS thread.
            saveBase64File(base64Data, fileName, mimeType);
        }
    }
}
