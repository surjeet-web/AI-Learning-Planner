const APP_BASE_URL = "http://localhost:3000"

const chrome = window.chrome // Declare the chrome variable

chrome.action.onClicked.addListener(async (tab) => {
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Extract OG/meta quickly
        const get = (sel) => document.querySelector(sel)?.getAttribute("content") || ""
        const title = get('meta[property="og:title"]') || get('meta[name="twitter:title"]') || document.title || ""
        const description = get('meta[property="og:description"]') || get('meta[name="description"]') || ""
        return { url: location.href, title, description }
      },
    })
    const payload = res?.result || { url: tab.url }
    await fetch(`${APP_BASE_URL}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    chrome.notifications?.create?.({
      type: "basic",
      iconUrl: "icon48.png",
      title: "Captured",
      message: "Course sent to AI Learning Planner",
    })
  } catch (e) {
    console.error(e)
  }
})
