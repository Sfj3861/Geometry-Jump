package com.safjran.geometryjump;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView web;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        applyImmersiveMode();
        web = new WebView(this);
        web.setBackgroundColor(0xff101f2c);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false); s.setSupportZoom(false);
        s.setBuiltInZoomControls(false); s.setDisplayZoomControls(false);
        web.setFocusable(true); web.setFocusableInTouchMode(true);
        web.setWebViewClient(new WebViewClient()); web.setWebChromeClient(new WebChromeClient());
        setContentView(web); web.loadUrl("file:///android_asset/index.html");
    }
    private void applyImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }
    @Override public boolean dispatchKeyEvent(KeyEvent e) {
        if (web != null && (e.getKeyCode()==KeyEvent.KEYCODE_SPACE || e.getKeyCode()==KeyEvent.KEYCODE_DPAD_UP ||
            e.getKeyCode()==KeyEvent.KEYCODE_W || e.getKeyCode()==KeyEvent.KEYCODE_P ||
            e.getKeyCode()==KeyEvent.KEYCODE_R || e.getKeyCode()==KeyEvent.KEYCODE_ESCAPE)) {
            String code="Unidentified", key="Unidentified";
            switch(e.getKeyCode()) {
                case KeyEvent.KEYCODE_SPACE: code="Space"; key=" "; break;
                case KeyEvent.KEYCODE_DPAD_UP: code="ArrowUp"; key="ArrowUp"; break;
                case KeyEvent.KEYCODE_W: code="KeyW"; key="w"; break;
                case KeyEvent.KEYCODE_P: code="KeyP"; key="p"; break;
                case KeyEvent.KEYCODE_R: code="KeyR"; key="r"; break;
                case KeyEvent.KEYCODE_ESCAPE: code="Escape"; key="Escape"; break;
            }
            final String js="window.dispatchEvent(new KeyboardEvent('"+(e.getAction()==KeyEvent.ACTION_DOWN?"keydown":"keyup")+"',{key:'"+key+"',code:'"+code+"',bubbles:true,cancelable:true,repeat:"+(e.getRepeatCount()>0?"true":"false")+"}))";
            web.evaluateJavascript(js,null); return true;
        }
        return super.dispatchKeyEvent(e);
    }
    @Override public void onBackPressed() { if(web!=null)web.evaluateJavascript("window.gameBack && window.gameBack()",null);else super.onBackPressed(); }
    @Override protected void onResume(){super.onResume();applyImmersiveMode();if(web!=null)web.onResume();}
    @Override protected void onPause(){if(web!=null)web.onPause();super.onPause();}
    @Override protected void onDestroy(){if(web!=null){web.stopLoading();web.destroy();}super.onDestroy();}
}