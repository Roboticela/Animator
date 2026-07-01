// SPDX-License-Identifier: MIT

package app.tauri.androidui

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.view.WindowManager
import android.webkit.WebView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

@InvokeArg
class MosaicArg {
  lateinit var mosaic: String
}

@InvokeArg
class LetterboxArg {
  @JvmField
  var contouredLetterboxArgb: Int = 0xFF0F0F0F.toInt()
}

@TauriPlugin
class AndroidUiPlugin(private val activity: Activity) : Plugin(activity) {
  private var webView: WebView? = null
  private var current: String = "standard"
  private var letterboxArgb: Int = 0xFF0F0F0F.toInt()

  override fun load(webView: WebView) {
    this.webView = webView
  }

  @Command
  fun setContouredLetterboxArgb(invoke: Invoke) {
    val a = invoke.parseArgs(LetterboxArg::class.java)
    letterboxArgb = a.contouredLetterboxArgb
    invoke.resolve()
  }

  @Command
  fun setMosaic(invoke: Invoke) {
    val a = invoke.parseArgs(MosaicArg::class.java)
    val key = a.mosaic.lowercase()
    current = key
    when (key) {
      "cinematic" -> applyCinematic()
      "contoured" -> applyContoured()
      else -> applyStandard()
    }
    invoke.resolve()
  }

  @Command
  fun getMosaic(invoke: Invoke) {
    val o = JSObject()
    o.put("mosaic", current)
    invoke.resolve(o)
  }

  private fun applyStandard() = activity.runOnUiThread {
    val wv = webView ?: return@runOnUiThread
    val window = activity.window
    wv.setOnApplyWindowInsetsListener(null)
    wv.setPadding(0, 0, 0, 0)
    wv.setBackgroundColor(Color.TRANSPARENT)
    WindowCompat.setDecorFitsSystemWindows(window, true)
    ViewCompat.setOnApplyWindowInsetsListener(wv) { v, insets -> ViewCompat.onApplyWindowInsets(v, insets) }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      val lp = window.attributes
      lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT
      window.attributes = lp
    }
    val c = WindowCompat.getInsetsController(window, wv)
    c.show(WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.navigationBars())
  }

  private fun applyCinematic() = activity.runOnUiThread {
    val wv = webView ?: return@runOnUiThread
    val window = activity.window
    wv.setOnApplyWindowInsetsListener(null)
    cutoutShortEdges()
    wv.setBackgroundColor(Color.TRANSPARENT)
    WindowCompat.setDecorFitsSystemWindows(window, false)
    wv.setPadding(0, 0, 0, 0)
    window.statusBarColor = Color.TRANSPARENT
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      @Suppress("DEPRECATION")
      window.navigationBarColor = Color.TRANSPARENT
    }
    val c = WindowCompat.getInsetsController(window, wv)
    c.hide(WindowInsetsCompat.Type.systemBars())
    c.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    ViewCompat.setOnApplyWindowInsetsListener(wv) { _, _ -> WindowInsetsCompat.CONSUMED }
  }

  private fun applyContoured() = activity.runOnUiThread {
    val wv = webView ?: return@runOnUiThread
    val window = activity.window
    wv.setOnApplyWindowInsetsListener(null)
    wv.setPadding(0, 0, 0, 0)
    cutoutShortEdges()
    wv.setBackgroundColor(letterboxArgb)
    activity.window.decorView.setBackgroundColor(letterboxArgb)
    window.statusBarColor = letterboxArgb
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      @Suppress("DEPRECATION")
      window.navigationBarColor = letterboxArgb
    }
    WindowCompat.setDecorFitsSystemWindows(window, false)
    val c = WindowCompat.getInsetsController(window, wv)
    c.hide(WindowInsetsCompat.Type.systemBars())
    c.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    ViewCompat.setOnApplyWindowInsetsListener(wv) { v, insets ->
      val bars = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or
          WindowInsetsCompat.Type.displayCutout(),
      )
      v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      insets
    }
  }

  private fun cutoutShortEdges() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      val w = activity.window
      val lp = w.attributes
      lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
      w.attributes = lp
    }
  }
}
