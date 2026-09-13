/* UI prototype only. No network requests, storage, model calls or production risk engine. */
(() => {
  'use strict';
  const root = document.getElementById('wp-home');
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const dialog = $('#wp-dialog');
  const content = $('#wp-dialog-content');
  const title = $('#wp-dialog-title');
  const badge = $('#wp-dialog-badge');
  const textarea = $('#wp-question');
  let currentStep = 0;
  let returnFocus = null;
  let mode = 'demo';
  let toastTimer;
  // Deliberately invented teaching values; never use as production risk inputs.
  const DEMO = Object.freeze({ brazilShare: 0.6, brazilIntensity: 0.4, guangxiIntensity: 0.5, failure: 0.5, inventory: 0.05, replacement: 0.1 });
  let comparisonShare = DEMO.brazilShare;
  const percent = (v, digits=1) => (v * 100).toFixed(digits) + '%';
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const calc = (share) => {
    const a=share*DEMO.brazilIntensity, b=(1-share)*DEMO.guangxiIntensity;
    return {a, b, aShare:a/(a+b), bShare:b/(a+b), leader:Math.abs(a-b)<1e-10?'两地相同':a>b?'巴西示例节点':'广西示例节点'};
  };
  function toast(message){ clearTimeout(toastTimer); const el=$('#wp-toast');el.textContent=message;el.hidden=false;toastTimer=setTimeout(()=>{el.hidden=true;},4500); }
  function openDialog(name, label){returnFocus=document.activeElement;title.textContent=name;badge.textContent=label;dialog.showModal();dialog.scrollTop=0;$('#wp-close').focus();}
  function actions(nextLabel, previous=true, extra='') { return `<div class="wp-dialog-actions">${previous?'<button class="wp-btn wp-btn-quiet" data-step="back">上一步</button>':'<small>示例不会使用你的文件或调用线上分析</small>'}${extra}<button class="wp-btn wp-btn-primary" data-step="next">${nextLabel} <span aria-hidden="true">→</span></button></div>`; }
  function demo(openAt=0){mode='demo';currentStep=openAt;comparisonShare=DEMO.brazilShare;renderDemo();openDialog('跟随一份甘蔗采购，走完分析过程。','模拟采购情景');}
  function renderDemo(){
    const tabs=['采购信息','数据检查','重点节点','冲击情景'];
    const navigation=`<ol class="wp-wizard-tabs" aria-label="示例步骤">${tabs.map((t,i)=>`<li ${i===currentStep?'aria-current="step"':''}><span>0${i+1}</span>${t}</li>`).join('')}</ol>`;
    let body='';
    if(currentStep===0) body=`<h3>先把你的问题，整理成清楚的信息。</h3><p>这是一个虚构的甘蔗采购问题。助手应先整理关键信息，再判断可以开展哪些分析。</p><blockquote class="wp-quote">“假设本年度甘蔗采购按数量计算，巴西占60%，广西占40%。我应该优先关注哪里？”</blockquote><div class="wp-data-grid"><div><small>原材料</small><strong>甘蔗</strong></div><div><small>巴西示例节点</small><strong>60%</strong></div><div><small>广西示例节点</small><strong>40%</strong></div></div><p>参考时期：假设本年度 · 比例口径：同一种原材料的采购总量</p><p class="wp-note">这两处名称仅用于讲解。真实分析需要核对具体采购范围；点击下一步表示继续浏览，不代表完成真实数据核验。</p>${actions('查看数据检查',false)}`;
    if(currentStep===1) body=`<h3>资料是否足够，先讲清楚。</h3><p>采购信息、水风险数据和材料参数应分别保留来源。没有数据时，助手需要说明缺什么，以及还能先做什么。</p><div class="wp-table-wrap"><table><thead><tr><th>需要的信息</th><th>本例如何处理</th><th>数据身份</th></tr></thead><tbody><tr><td>采购结构与时期</td><td>巴西60%，广西40%；假设本年度</td><td><span class="wp-tag">教学设定</span></td></tr><tr><td>节点风险强度</td><td>巴西0.40，广西0.50；为方便解释而指定</td><td><span class="wp-tag">教学设定</span></td></tr><tr><td>地点水危险与材料参数</td><td>本交互示例未查询，未运行完整风险模型</td><td><span class="wp-tag">未核验</span></td></tr></tbody></table></div><p class="wp-note">如果真实用户只提供60%的采购来源，剩余40%应保留为未知份额；不能把已知部分当成全部采购。阻断字段不足时，应提示补充，暂停正式评分。</p>${actions('查看示意结果')}`;
    if(currentStep===2) body=`<h3>采购占比，也会改变关注顺序。</h3><p>下图只演示“采购占比 × 设定的节点风险强度”的关系。拖动占比，观察风险贡献如何变化。</p><div class="wp-result-grid"><div class="wp-result-panel"><h4>对组合风险的贡献份额</h4><div class="wp-bar-row"><span>巴西示例节点</span><div class="wp-track"><i id="wp-demo-bar-a"></i></div><strong id="wp-demo-share-a"></strong></div><div class="wp-bar-row"><span>广西示例节点</span><div class="wp-track"><i class="wp-bar-blue" id="wp-demo-bar-b"></i></div><strong id="wp-demo-share-b"></strong></div><label class="wp-slider-label" for="wp-share-slider"><span>巴西采购占比</span><strong id="wp-slider-value"></strong></label><input id="wp-share-slider" type="range" min="10" max="90" step="5" value="${comparisonShare*100}" aria-describedby="wp-slider-note"><p id="wp-slider-note" style="font-size:10px;margin-top:8px">广西占比同步补足至100%；其余设定保持不变。</p></div><div class="wp-reading" aria-live="polite" aria-atomic="true"><strong id="wp-demo-leader"></strong><p id="wp-demo-explain"></p><p style="margin-top:12px">管理讨论可以从核验采购依赖、了解产地情况开始。这里的排序不构成实际采购调整建议。</p></div></div><p class="wp-note">本例展示教学设定下的计算关系，不能作为正式风险评估。两地强度与采购比例均为假设，贡献份额不是供应损失比例。</p>${actions('查看节点失效示例')}`;
    if(currentStep===3) body=`<h3>供应受到冲击后，缓冲够不够？</h3><p>回到固定的60% / 40%示例基准：假设巴西节点有50%的供应无法交付；库存可覆盖总需求的5%，替代供应可覆盖10%。</p><div class="wp-result-grid"><div class="wp-result-panel"><h4>未满足需求占总需求的比例</h4><div class="wp-metric">15<small>%</small></div><p>30%受影响供应 − 5%库存 − 10%替代供应</p></div><div class="wp-reading"><strong>下一步应核验缓冲条件</strong><p>确认库存是否可用于同一时期、替代供应是否满足材料与交付要求，再讨论应对措施。</p><p style="margin-top:12px">这是节点失效的假设演算，不是干旱导致缺货的预测。</p></div></div><div class="wp-breakdown"><div>受影响供应<strong>30%</strong></div><div>库存使用<strong>5%</strong></div><div>替代供应<strong>10%</strong></div><div>未满足需求<strong>15%</strong></div></div><p class="wp-note">所有比例都以同一时期的总需求为分母。情景采用固定示例基准，不沿用上一页滑块的探索值。真实结果须来自现有情景计算工具，并保留完整假设。</p><div class="wp-dialog-actions"><button class="wp-btn wp-btn-quiet" data-step="back">上一步</button><button class="wp-btn wp-btn-quiet" data-action="download-demo">下载示例说明</button><button class="wp-btn wp-btn-primary" data-action="return-input">带着自己的问题开始 ↗</button></div>`;
    content.innerHTML=navigation+`<div class="wp-dialog-body">${body}</div>`;
    if(currentStep===2) updateComparison();
    dialog.scrollTop=0;
  }
  function updateComparison(){const r=calc(comparisonShare);$('#wp-demo-bar-a').style.width=percent(r.aShare);$('#wp-demo-bar-b').style.width=percent(r.bShare);$('#wp-demo-share-a').textContent=percent(r.aShare);$('#wp-demo-share-b').textContent=percent(r.bShare);$('#wp-slider-value').textContent=percent(comparisonShare,0);$('#wp-demo-leader').textContent=r.leader==='两地相同'?'两地贡献相同':`当前示意排序：${r.leader}优先`;$('#wp-demo-explain').textContent=`节点强度保持为巴西0.40、广西0.50；按当前采购占比计算，贡献值分别为${r.a.toFixed(3)}和${r.b.toFixed(3)}。份额以两地贡献之和为分母。`;}
  function evidence(){mode='evidence';content.innerHTML=`<div class="wp-dialog-body"><h3>数字是怎样得到的</h3><p>为了说明“采购占比”和“风险贡献”之间的关系，本页使用一组独立教学设定，不沿用研究报告或线上案例的计算值。</p><div class="wp-table-wrap"><table><thead><tr><th>示例节点</th><th>采购占比</th><th>设定强度</th><th>加权贡献</th><th>贡献份额</th></tr></thead><tbody><tr><td>巴西</td><td>60%</td><td>0.40</td><td>0.240</td><td>54.5%</td></tr><tr><td>广西</td><td>40%</td><td>0.50</td><td>0.200</td><td>45.5%</td></tr></tbody></table></div><p>加权贡献 = 采购占比 × 设定强度。贡献份额 = 该节点贡献 ÷ 两地贡献之和。显示值保留一位小数。</p><ul class="wp-evidence-list"><li>采购比例和节点强度均为假设，不是观测或已核验数据。</li><li>本例未查询Aqueduct、SPEI或材料参数库，不能作为实际地区风险结论。</li><li>节点失效示例：60% × 50% = 30%；30% = 5% + 10% + 15%。</li><li>正式使用时，来源、覆盖率、缺口和版本应由真实分析结果提供。</li></ul><div class="wp-dialog-actions"><small>当前版本：homepage-demo-1.0</small><button class="wp-btn wp-btn-primary" data-action="demo-in-dialog">进入完整示例 →</button></div></div>`;openDialog('查看示例依据','教学设定 · 未核验');}
  async function handoff(action,payload={}){
    const bridge=window.WaterPulseHomepageBridge;
    // The host must explicitly register an adapter; no guessed API endpoint.
    if(bridge&&typeof bridge.handleAction==='function'){
      const button=$('#wp-form button[type=submit]');button.disabled=true;
      try{await bridge.handleAction({action,payload,source:'waterpulse-home',version:'1.0'});}
      catch(err){toast('暂时未能进入分析，请稍后重试。输入内容已保留。');}
      finally{button.disabled=false;}
      return;
    }
    mode='handoff';
    const descriptions={submit:'你的内容已保留在输入框中。此预览仅支持示例体验，尚未提交分析。',upload:'正式页面可使用原网站的Excel / CSV上传入口。此预览不会读取或上传你的文件。',template:'此预览未提供计算模板。正式页面应下载与当前计算版本配套的Excel模板。'};
    const text=descriptions[action]||'此预览仅支持示例体验。';
    content.innerHTML=`<div class="wp-dialog-body"><p>${text}</p>${action==='submit'?`<blockquote class="wp-quote">${escapeHtml(payload.text)}</blockquote>`:''}<p class="wp-note">你可以先体验模拟采购流程，了解信息检查、重点节点和情景对照的呈现方式。</p><div class="wp-dialog-actions"><button class="wp-btn wp-btn-quiet" data-action="close">返回首页</button><button class="wp-btn wp-btn-primary" data-action="demo-in-dialog">体验示例 →</button></div></div>`;
    openDialog('先了解一次完整分析','本地交互预览');
  }
  function downloadDemo(){
    const note=`WaterPulse 首页示例说明\n版本：homepage-demo-1.0\n\n模拟采购情景，全部数值为教学设定；不代表真实企业或地区风险。\n固定基准：甘蔗，假设本年度，数量口径；巴西60%，广西40%。\n设定节点强度：巴西0.40，广西0.50。\n贡献值：0.60×0.40=0.240；0.40×0.50=0.200。\n贡献份额：54.5%和45.5%。未执行正式路径匹配模型。\n\n节点失效：固定基准下，巴西供应减少50%，受影响供应占总需求30%。\n库存可覆盖总需求5%，替代供应可覆盖10%，未满足需求15%。\n30%=5%+10%+15%，均为同一时期总需求口径。\n不沿用滑块探索值；不是干旱造成供应缺口的预测。\n\n下一步核验：具体采购范围、实际采购份额、地点水危险与材料参数、库存可用性、替代供应容量。\n真实分析应由现有计算工具返回结果，保留来源、数据身份、假设、缺口和版本。\n`;
    const url=URL.createObjectURL(new Blob([note],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='WaterPulse_模拟采购示例说明.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('示例说明已下载，保留了全部教学设定。');
  }
  root.addEventListener('click',e=>{
    const prompt=e.target.closest('[data-prompt]');if(prompt){textarea.value=prompt.dataset.prompt;textarea.focus();$('#wp-form-error').hidden=true;return;}
    const step=e.target.closest('[data-step]');if(step){currentStep=Math.max(0,Math.min(3,currentStep+(step.dataset.step==='next'?1:-1)));renderDemo();$('#wp-dialog-content h3').setAttribute('tabindex','-1');$('#wp-dialog-content h3').focus();return;}
    const button=e.target.closest('[data-action]');if(!button)return;
    switch(button.dataset.action){case'demo':demo();break;case'evidence':evidence();break;case'demo-in-dialog':currentStep=0;comparisonShare=DEMO.brazilShare;mode='demo';title.textContent='跟随一份甘蔗采购，走完分析过程。';badge.textContent='模拟采购情景';renderDemo();break;case'upload':handoff('upload');break;case'template':handoff('template');break;case'close':dialog.close();break;case'return-input':returnFocus=textarea;dialog.close();textarea.focus();textarea.scrollIntoView({block:'center',behavior:'auto'});break;case'download-demo':downloadDemo();break;}
  });
  root.addEventListener('input',e=>{if(e.target.id==='wp-share-slider'){comparisonShare=Number(e.target.value)/100;updateComparison();}});
  $('#wp-form').addEventListener('submit',e=>{e.preventDefault();const text=textarea.value.trim();if(!text){$('#wp-form-error').textContent='请先描述你的问题，或点击“体验示例”。';$('#wp-form-error').hidden=false;textarea.focus();return;}$('#wp-form-error').hidden=true;handoff('submit',{text});});
  $('#wp-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{if(returnFocus&&returnFocus.isConnected)returnFocus.focus();});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  // Deliberately exposes only view controls, never production numeric calculations.
  window.WaterPulseHomepage=Object.freeze({openDemo:()=>demo(),close:()=>dialog.close(),focusInput:()=>textarea.focus()});
})();
