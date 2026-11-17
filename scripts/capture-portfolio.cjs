'use strict';

// Run a development build with --remote-debugging-port=9243 first.
// The question/answer, mock and dashboard images below contain demo data.
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { findOfflineAnswer } = require('../src/offline-answers.cjs');

async function main() {
  const port = Number(process.argv[2] || 9243);
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  const pending = new Map();
  let serial = 0;
  socket.on('message', raw => {
    const message = JSON.parse(raw);
    if (pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  await new Promise(resolve => socket.on('open', resolve));
  const send = (method, params = {}) => new Promise(resolve => {
    const id = ++serial;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const reply = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (reply.result.exceptionDetails) throw new Error(reply.result.exceptionDetails.text);
    return reply.result.result.value;
  };
  const output = path.join(__dirname, '..', 'portfolio', 'images');
  fs.mkdirSync(output, { recursive: true });
  const screenshot = async name => {
    const reply = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(output, name), Buffer.from(reply.result.data, 'base64'));
  };
  await send('Page.reload');
  await new Promise(resolve => setTimeout(resolve, 450));
  await screenshot('01-setup.png');
  await evaluate('document.getElementById("mockMode").click();true');
  await screenshot('02-mock-setup.png');
  await evaluate('document.getElementById("liveMode").click();true');
  await evaluate('document.getElementById("setup").classList.add("hidden");document.getElementById("sessionView").classList.remove("hidden");window.overlay.compact(true)');
  for (const [name, language, question, manual] of [
    ['03-live-en.png', 'en', 'What is a database index?', false],
    ['06-live-sr-manual.png', 'sr', 'Kako biste optimizovali spor SQL upit?', true]
  ]) {
    const answer = findOfflineAnswer(question, language)?.answer;
    if (!answer) throw new Error(`No offline answer for ${question}`);
    await evaluate(`(()=>{
      if (${JSON.stringify(language)} === 'sr') document.getElementById('uiSerbian').click();
      document.getElementById('question').textContent=${JSON.stringify(question)};
      document.getElementById('answer').textContent=${JSON.stringify(answer)};
      document.getElementById('question').className='content-text';
      document.getElementById('answer').className='content-text';
      document.getElementById('statusText').textContent=${JSON.stringify(language === 'sr' ? 'SPREMNO ZA NOVO PITANJE' : 'READY FOR A NEW QUESTION')};
      document.getElementById('providerBadge').textContent=${JSON.stringify(language === 'sr' ? 'LOKALNO · 0 TOKENA' : 'OFFLINE · 0 TOKENS')};
      document.getElementById('languageBadge').textContent=${JSON.stringify(language.toUpperCase())};
      document.getElementById('captureModeButton').textContent=${JSON.stringify(manual ? 'MANUELNO' : 'AUTO')};
      document.getElementById('manualAction').classList.toggle('hidden',${!manual});
      document.getElementById('manualAction').textContent=${JSON.stringify(language === 'sr' ? '● SNIMI PITANJE' : '● RECORD QUESTION')};
      document.getElementById('captureHint').textContent=${JSON.stringify(language === 'sr' ? 'SISTEMSKI ZVUK' : 'SYSTEM AUDIO')};
      return true;
    })()`);
    await screenshot(name);
  }
  await evaluate(`(()=>{
    document.getElementById('uiEnglish').click();
    document.getElementById('providerBadge').textContent='OFFLINE · 0 TOKENS';
    document.getElementById('languageBadge').textContent='EN';
    document.getElementById('question').textContent='What is the difference between props and state in React?';
    document.getElementById('answer').textContent='Props are inputs passed to a component. State is data the component owns and can update. Both can change what React renders.';
    document.getElementById('questionLabel').textContent='PRACTICE QUESTION';
    document.getElementById('answerLabel').textContent='PREPARED ANSWER';
    document.getElementById('mockSpoken').classList.remove('hidden');
    document.getElementById('mockSpoken').textContent='YOU SAID  Props come from the parent, while state changes inside a component.';
    document.getElementById('captureHint').textContent='MICROPHONE · PRACTICE';
    document.getElementById('captureModeButton').textContent='MOCK';
    document.getElementById('statusText').textContent='ANSWER REVEALED';
    document.getElementById('mockReveal').classList.remove('hidden');
    document.getElementById('mockNext').classList.remove('hidden');
    document.getElementById('manualAction').classList.add('hidden');
    return true;
  })()`);
  await screenshot('04-mock-practice.png');
  await evaluate(`(async()=>{
    document.getElementById('uiEnglish').click();
    document.getElementById('sessionView').classList.add('hidden');
    document.getElementById('setup').classList.remove('hidden');
    await window.overlay.compact(false);
    document.getElementById('historyPanel').open=true;
    await new Promise(resolve=>setTimeout(resolve,150));
    const dashboard=document.getElementById('dashboard');
    dashboard.replaceChildren();
    for(const [label,value] of [
      ['Questions','1'],['Total tokens','0'],['Tokens / question','0'],['Average wait','1.2 s'],
      ['Recognition','1.2 s'],['Answer','4 ms'],['90% of questions within','1.2 s'],['Offline match','100%']
    ]){
      const cell=document.createElement('div');cell.className='dashboard-cell';
      const name=document.createElement('span');name.textContent=label;
      const amount=document.createElement('strong');amount.textContent=value;
      cell.append(name,amount);dashboard.append(cell);
    }
    const breakdown=document.createElement('div');breakdown.className='dashboard-breakdown';
    breakdown.textContent='Offline: 1 question · 0 tokens/question · 1.2 s';dashboard.append(breakdown);
    const practice=document.createElement('div');practice.className='dashboard-breakdown';
    practice.textContent='Mock practice: 1 completed question · 0 tokens';dashboard.append(practice);
    document.getElementById('historyList').textContent='Example sessions · Live: 1 question · Mock: 1 completed question';
    document.getElementById('historyPanel').scrollIntoView({block:'start'});
    return true;
  })()`);
  await screenshot('05-dashboard-demo.png');
  await evaluate(`(async()=>{
    document.getElementById('historyPanel').open=false;
    document.getElementById('feedbackWorkflow').click();
    document.getElementById('source').value='microphone';
    document.getElementById('setup').scrollTop=0;
    return true;
  })()`);
  await screenshot('08-feedbacker-setup.png');
  await evaluate(`(async()=>{
    document.getElementById('setup').classList.add('hidden');
    document.getElementById('sessionView').classList.remove('hidden');
    document.getElementById('feedbackControls').classList.remove('hidden');
    document.getElementById('captureModeButton').classList.add('hidden');
    document.getElementById('mockReveal').classList.add('hidden');
    document.getElementById('mockNext').classList.add('hidden');
    document.getElementById('mockSpoken').classList.add('hidden');
    document.getElementById('questionLabel').textContent='WORKSHOP TRANSCRIPT';
    document.getElementById('answerLabel').textContent='ASMA FEEDBACK';
    document.getElementById('statusText').textContent='ROUND 1 · REVIEWER 2';
    document.getElementById('providerBadge').textContent='CODEX';
    document.getElementById('languageBadge').textContent='EN';
    document.getElementById('captureHint').textContent='MICROPHONE';
    document.getElementById('feedbackReviewer2').classList.add('selected');
    document.getElementById('feedbackCandidate').classList.remove('selected');
    document.getElementById('question').textContent='QUESTION · Tell me about a production incident you resolved.\\n\\nCANDIDATE · Our API timed out. I checked logs, found an overloaded database connection pool, adjusted it, and added an alert. The error rate dropped after deployment.\\n\\nREVIEWER 1 · Clear diagnosis and sequence.\\n\\nREVIEWER 2 · I wanted to hear how the team coordinated and whether the alert prevented recurrence.';
    document.getElementById('question').className='content-text';
    document.getElementById('answer').textContent='A · Good\\nS · You traced the timeout to the connection pool and said the error rate dropped after deployment.\\nM · The answer did not show how you coordinated with the team or checked for recurrence.\\nA · Next time, add one sentence about who you worked with and what the new alert showed afterward.';
    document.getElementById('answer').className='content-text';
    await window.overlay.compact(true);
    fitAnswer();
    await new Promise(resolve=>setTimeout(resolve,80));
    return true;
  })()`);
  await screenshot('09-feedbacker-demo.png');
  socket.close();
}

main().catch(error => { console.error(error); process.exitCode = 1; });
