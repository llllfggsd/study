// 作弊脚本 v4
// 任意页面运行，等待进入练习后自动秒答

;(async () => {
  const _st = window.setTimeout
  const wait = ms => new Promise(r => _st(r, ms))

  console.log('作弊脚本已就绪，等待进入练习页面...')

  // 轮询等待进入练习页
  while (!location.pathname.match(/\/categories\/\d+\/practice/)) {
    await wait(300)
  }

  console.log('检测到练习页面，准备中...')
  await wait(1000)

  // 处理 "继续/新练习" 弹窗
  const modalBtns = document.querySelectorAll('.modal .btn')
  if (modalBtns.length > 1) {
    console.log('点击新练习...')
    modalBtns[modalBtns.length - 1].click()
    await wait(800)
  }

  // 劫持 setTimeout，跳过 1 秒等待
  window.setTimeout = (fn, ms, ...a) => _st(fn, ms === 1000 ? 0 : ms, ...a)
  console.log('开始秒答...')

  while (true) {
    await wait(100)

    const modal = document.querySelector('.modal')
    if (modal && modal.querySelector('.btn-danger')) {
      console.log('被抓了！')
      break
    }

    if (document.querySelector('.result-page')) {
      console.log('居然没被抓？')
      break
    }

    const btn = document.querySelector('.practice-actions .btn')
    if (btn) { btn.click(); continue }

    const option = document.querySelector('.option-item:not(.disabled)')
    if (option) { option.click() }
  }

  window.setTimeout = _st
  console.log('脚本结束')
})()
