'use strict';

const { classifyUtterance } = require('./logic.cjs');

function normalize(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function isTransition(text) {
  const s = normalize(text);
  return /\b(let'?s (?:move (?:on )?to|start with|get into) (?:my |our |the )?questions|i(?:'d| would) like to (?:ask|start asking) you|now (?:for|to|let'?s) (?:the |my |our )?questions|let'?s (?:begin|start) (?:the |our )?interview|tell me about your (?:background|experience))\b/.test(s)
    || /\b(pre[đd]imo na pitanja|predjimo na pitanja|sada (?:cu|cemo) (?:vam |ti )?postaviti pitanja|krenimo (?:sa|s) pitanjima|pocnimo (?:sa|s) pitanjima|hajde (?:da )?(?:predjemo|pređemo) na pitanja|reci(?:te)? mi nesto o sebi)\b/.test(s);
}

function isIntroduction(text) {
  const s = normalize(text);
  return /\b(before we (?:start|begin)|first (?:i|we)(?:'ll| will) (?:tell|show|introduce|explain)|let me (?:tell|show) you (?:about|what)|a (?:brief |quick )?introduction (?:to|about)|introduction call|introduce the company|our (?:company|product|platform|business)|today'?s agenda|agenda today|the agenda (?:is|for)|i(?:'ll| will) (?:start|begin) with (?:an? )?(?:introduction|overview))\b/.test(s)
    || /\b(pre nego sto (?:pocnemo|krenemo)|prvo (?:cu|cemo) (?:vam |ti )?(?:predstaviti|objasniti|ispricati)|da (?:vam |ti )?predstavim|o nasoj (?:kompaniji|firmi|proizvodu)|nas proizvod|danasnji plan razgovora|kratak uvod)\b/.test(s);
}

function isCheckIn(text) {
  const s = normalize(text).replace(/[?.!]+$/g, '');
  return /\b(does (?:that|this|it) make (?:any )?sense|is that clear|can you hear me|can you see (?:me|my screen|the screen)|how are you|how'?s it going|do you have any (?:additional )?questions(?: (?:for me|so far|about (?:us|the (?:company|product))))?|any questions(?: so far| for me)?|would you like to ask (?:me|us) anything|shall we (?:start|begin)|do you mind if (?:i|we) (?:invite|record|share)|can (?:i|we) (?:invite|record|share)|may (?:i|we) (?:invite|record|share))\b/.test(s)
    || /\b(da li (?:je (?:to|ovo) jasno|ima smisla|me cuje[šs]|imate (?:neko|jos neko) pitanje)|imate li (?:pitanja|neko pitanje)|kako ste|kako si|zelite li (?:vi |ti )?(?:nesto )?da pitate)\b/.test(s);
}

class QuestionGate {
  constructor() { this.phase = 'open'; }

  startQuestions() { this.phase = 'interview'; }

  observe(text, hasCurrentQuestion = false, source = 'automatic') {
    const previousPhase = this.phase;
    const decision = classifyUtterance(text, hasCurrentQuestion, source);
    if (source === 'manual') return { action: decision, phase: this.phase, phaseChanged: false };
    if (isTransition(text)) this.phase = 'interview';
    else if (this.phase === 'open' && decision !== 'question' && isIntroduction(text)) this.phase = 'intro';
    if (decision === 'followup') return { action: 'followup', phase: this.phase, phaseChanged: this.phase !== previousPhase };
    if (decision !== 'question' || isCheckIn(text) || this.phase === 'intro') {
      return { action: 'ignore', phase: this.phase, phaseChanged: this.phase !== previousPhase };
    }
    this.phase = 'interview';
    return { action: 'question', phase: this.phase, phaseChanged: this.phase !== previousPhase };
  }
}

module.exports = { QuestionGate, isTransition, isIntroduction, isCheckIn };
