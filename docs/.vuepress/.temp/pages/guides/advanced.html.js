export const data = {
  "key": "v-7ffe0758",
  "path": "/guides/advanced.html",
  "title": "Advanced Guide",
  "lang": "en-US",
  "frontmatter": {
    "tags": [
      ""
    ]
  },
  "excerpt": "",
  "headers": [],
  "filePathRelative": "guides/advanced.md",
  "git": {
    "updatedTime": 1630732364000,
    "contributors": [
      {
        "name": "Aaron Knox",
        "email": "aaron_knox@me.com",
        "commits": 1
      }
    ]
  }
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
