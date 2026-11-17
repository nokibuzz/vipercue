'use strict';

const patterns = [
  {
    match: s => /\b(optimiz|optimize|optimise|slow query|spor.*upit)/.test(s) && /\b(sql|query|upit|database|baza)/.test(s),
    sr: 'Prvo bih proverio plan izvršavanja i našao najskuplji korak. Zatim bih prilagodio upit ili indeks i ponovo izmerio vreme i uticaj na upise.',
    en: 'I would inspect the execution plan to find the expensive step. Then I would adjust the query or indexes and measure latency and write overhead again.'
  },
  {
    match: s => /\b(index|indeks)/.test(s) && /\b(what is|sta je|objasni|explain|how does|kako radi)/.test(s),
    sr: 'Indeks je struktura koja ubrzava pronalaženje redova bez skeniranja cele tabele. Ubrzava čitanje, ali zauzima prostor i može usporiti upise.',
    en: 'An index helps find rows without scanning the whole table. It speeds up reads but uses storage and can slow writes.'
  },
  {
    match: s => /\b(cache|caching|kes|kesiranje)/.test(s) && /\b(what is|sta je|how does|kako radi|objasni|explain)/.test(s),
    sr: 'Keš čuva često tražene podatke bliže korisniku ili aplikaciji, pa smanjuje latenciju i opterećenje izvora. Važno je definisati kada podaci zastarevaju i kako se osvežavaju.',
    en: 'A cache keeps frequently used data closer to the application, reducing latency and load on the source. The main tradeoff is deciding when cached data expires or refreshes.'
  },
  {
    match: s => /\b(rest api|restful)/.test(s) && /\b(what is|sta je|objasni|explain|princip|kako radi|how does)/.test(s),
    sr: 'REST API izlaže resurse preko HTTP metoda kao što su GET, POST, PUT i DELETE. Klijent i server razmenjuju reprezentacije resursa, a zahtevi treba da budu bez stanja na serveru.',
    en: 'A REST API exposes resources through HTTP methods such as GET, POST, PUT and DELETE. Requests are stateless, and clients exchange resource representations with the server.'
  },
  {
    match: s => /\b(deadlock|mrtv.*blokad)/.test(s) && /\b(what is|sta je|objasni|explain|how|kako)/.test(s),
    sr: 'Deadlock nastaje kada dve ili više operacija čekaju jedna na drugu i nijedna ne može da nastavi. Smanjuje se doslednim redosledom zaključavanja, kraćim transakcijama i detekcijom zastoja.',
    en: 'A deadlock occurs when operations wait on each other and none can proceed. Consistent lock ordering, shorter transactions and deadlock detection reduce the risk.'
  },
  {
    match: s => /\b(race condition|trka podataka|uslov trke)/.test(s) && /\b(what is|sta je|objasni|explain|how|kako)/.test(s),
    sr: 'Uslov trke nastaje kada rezultat zavisi od redosleda istovremenih operacija. Rešava se sinhronizacijom, atomskim operacijama ili uklanjanjem deljenog promenljivog stanja.',
    en: 'A race condition occurs when the result depends on the timing of concurrent operations. Synchronization, atomic operations or avoiding shared mutable state can prevent it.'
  }
];

function quickAnswer(question, language) {
  const normalized = String(question || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const found = patterns.find(item => item.match(normalized));
  return found ? found[language === 'en' ? 'en' : 'sr'] : '';
}

module.exports = { quickAnswer };
