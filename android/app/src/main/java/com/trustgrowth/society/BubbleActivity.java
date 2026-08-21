package com.trustgrowth.society;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/**
 * Content shown when a notification bubble is tapped/expanded. Kept as a
 * plain, self-contained Activity (no layout XML, no WebView) so the bubble
 * opens instantly and shows the full notification text.
 *
 * Dragging the bubble down to the bottom-of-screen dismiss target is
 * handled entirely by the Android OS's built-in Bubbles UI — no extra code
 * needed here.
 */
public class BubbleActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String title = getIntent().getStringExtra("title");
        String body = getIntent().getStringExtra("body");
        if (title == null || title.isEmpty()) title = "Trust Growth Society";
        if (body == null) body = "";

        setTitle(title);

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.WHITE);
        layout.setPadding(0, 24, 0, 24);

        TextView titleView = new TextView(this);
        titleView.setText(title);
        titleView.setTextSize(20);
        titleView.setPadding(40, 16, 40, 12);
        titleView.setTextColor(Color.parseColor("#111111"));
        titleView.setGravity(Gravity.START);

        TextView bodyView = new TextView(this);
        bodyView.setText(body);
        bodyView.setTextSize(16);
        bodyView.setPadding(40, 0, 40, 24);
        bodyView.setTextColor(Color.parseColor("#333333"));
        bodyView.setLineSpacing(6f, 1f);

        layout.addView(titleView);
        layout.addView(bodyView);

        ScrollView scrollView = new ScrollView(this);
        scrollView.setBackgroundColor(Color.WHITE);
        scrollView.addView(layout);

        setContentView(scrollView);
    }
}
