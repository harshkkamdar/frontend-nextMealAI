package app.fiqr.mobile;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;

public class PermissionsRationaleActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = new WebView(this);
        setContentView(webView);
        webView.loadUrl("https://frontend-nextmealai.vercel.app/privacy");
    }
}
