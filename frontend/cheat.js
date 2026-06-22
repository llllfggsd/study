// 考试防作弊测试脚本 v5
// 用途：自动开始考试 -> 极速作答 -> 交卷，验证「答题时间异常」提示是否正常触发
// 任意页面运行；会自动等待进入考试页

;(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const byText = (txt) =>
    [...document.querySelectorAll('.practice-actions .btn')].find((b) => b.textContent.includes(txt))

  console.log('[考试测试] 已就绪，等待进入考试页面 /categories/:id/exam ...')
  while (!location.pathname.match(/\/categories\/\d+\/exam/)) {
    await wait(300)
  }
  console.log('[考试测试] 已进入考试页面，开始自动作答...')

  let verdict = null
  for (let i = 0; i < 2000; i++) {
    await wait(50)

    // 1) 被抓：作弊提示弹出 -> 防作弊正常
    if (document.querySelector('.modal .btn-danger')) {
      verdict = 'caught'
      break
    }
    // 2) 出分页：未被拦截 -> 提示未触发
    if (document.querySelector('.result-page')) {
      verdict = 'passed'
      break
    }

    // 3) 配置页：点击「开始考试」
    const start = byText('开始考试')
    if (start && !document.querySelector('.option-item')) {
      start.click()
      continue
    }

    // 4) 作答页：先确保本题已选，再翻页/交卷
    const hasOption = document.querySelector('.option-item')
    const selected = document.querySelector('.option-item.selected')
    if (hasOption && !selected) {
      hasOption.click()
      continue
    }

    const submit = byText('交卷')
    if (submit) {
      submit.click()
      continue
    }
    const next = byText('下一题')
    if (next) {
      next.click()
      continue
    }
  }

  if (verdict === 'caught') {
    console.log('%c[考试测试] ✅ 被拦截，防作弊提示正常触发', 'color:#34a853;font-weight:bold')
  } else if (verdict === 'passed') {
    console.log('%c[考试测试] ❌ 未被拦截，提示未触发（请检查时间校验）', 'color:#ea4335;font-weight:bold')
  } else {
    console.log('%c[考试测试] ⚠️ 超时退出，未得到结果', 'color:#fbbc04;font-weight:bold')
  }
})()
