package com.safjran.geometryjump;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 4172;
    private WebView web;
    private ValueCallback<Uri[]> fileChooserCallback;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        applyImmersiveMode();
        web = new WebView(this);
        web.setBackgroundColor(0xff101827);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(true);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        web.addJavascriptInterface(new AssetBridge(), "AndroidBridge");
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
                fileChooserCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (ActivityNotFoundException exception) {
                    fileChooserCallback = null;
                    return false;
                }
            }
        });
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    private void applyImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        if (web != null) {
            int androidCode = event.getKeyCode();
            int webCode = 0;
            String key = "Unidentified";
            String code = "Unidentified";
            switch (androidCode) {
                case KeyEvent.KEYCODE_SPACE: webCode=32; key=" "; code="Space"; break;
                case KeyEvent.KEYCODE_DPAD_UP: webCode=38; key="ArrowUp"; code="ArrowUp"; break;
                case KeyEvent.KEYCODE_DPAD_DOWN: webCode=40; key="ArrowDown"; code="ArrowDown"; break;
                case KeyEvent.KEYCODE_DPAD_LEFT: webCode=37; key="ArrowLeft"; code="ArrowLeft"; break;
                case KeyEvent.KEYCODE_DPAD_RIGHT: webCode=39; key="ArrowRight"; code="ArrowRight"; break;
                case KeyEvent.KEYCODE_W: webCode=87; key="w"; code="KeyW"; break;
                case KeyEvent.KEYCODE_I: webCode=73; key="i"; code="KeyI"; break;
                case KeyEvent.KEYCODE_X: webCode=88; key="x"; code="KeyX"; break;
                case KeyEvent.KEYCODE_Z: webCode=90; key="z"; code="KeyZ"; break;
                case KeyEvent.KEYCODE_ENTER: webCode=13; key="Enter"; code="Enter"; break;
                case KeyEvent.KEYCODE_P: webCode=80; key="p"; code="KeyP"; break;
                case KeyEvent.KEYCODE_ESCAPE: webCode=27; key="Escape"; code="Escape"; break;
                default: break;
            }
            if (webCode != 0) {
                String type = event.getAction() == KeyEvent.ACTION_DOWN ? "keydown" : "keyup";
                String js = "(()=>{const e=new KeyboardEvent('" + type + "',{key:'" + key + "',code:'" + code +
                    "',bubbles:true,cancelable:true,repeat:" + (event.getRepeatCount() > 0 ? "true" : "false") +
                    "});Object.defineProperty(e,'keyCode',{get:()=>"+webCode+"});Object.defineProperty(e,'which',{get:()=>"+webCode+"});document.dispatchEvent(e);})();";
                web.evaluateJavascript(js, null);
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST && fileChooserCallback != null) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) result = new Uri[]{data.getData()};
            fileChooserCallback.onReceiveValue(result);
            fileChooserCallback = null;
        }
    }

    @Override public void onBackPressed() {
        if (web != null) web.evaluateJavascript("window.gameBack && window.gameBack()", null);
        else super.onBackPressed();
    }

    @Override protected void onResume() {
        super.onResume();
        applyImmersiveMode();
        if (web != null) web.onResume();
    }

    @Override protected void onPause() {
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override protected void onDestroy() {
        if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
        if (web != null) { web.stopLoading(); web.destroy(); }
        super.onDestroy();
    }

    private final class AssetBridge {
        @JavascriptInterface public String readAssetBase64(String assetName) {
            if (!"famidash.nes".equals(assetName)) return "";
            try (InputStream input = getAssets().open(assetName);
                 ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[16384];
                int count;
                while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
                return Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP);
            } catch (IOException exception) {
                return "";
            }
        }
    }
}