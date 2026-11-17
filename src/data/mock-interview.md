# Mock interview practice deck

This deck is bundled with the app. Questions and reference answers are prepared in English and Serbian. Personal examples are placeholders; candidates should answer with their own facts.

## hr-introduction
Category: HR
Aliases: tell me about yourself; recite mi nesto o sebi
Q-SR: Recite mi nešto o sebi i svom iskustvu.
A-SR: Ukratko povežite svoju glavnu oblast rada, jedan stvarni rezultat i razlog zbog kojeg vas ova pozicija zanima. Koristite konkretan primer iz sopstvenog iskustva.
Q-EN: Tell me about yourself and your experience.
A-EN: Connect your main area of work, one real result, and why this role interests you. Use a concrete example from your own experience.
Source: Prepared practice prompt

## hr-motivation
Category: HR
Aliases: why this role; zasto ova pozicija
Q-SR: Zašto želite ovu poziciju?
A-SR: Povežite konkretan deo posla sa veštinom koju zaista imate i objasnite doprinos koji želite da ostvarite. Izbegnite opšte pohvale kompaniji bez primera.
Q-EN: Why do you want this role?
A-EN: Connect a specific part of the role to a skill you really have, then explain the contribution you want to make. Avoid generic praise without an example.
Source: Prepared practice prompt

## hr-challenge
Category: HR
Aliases: difficult project; izazovan projekat
Q-SR: Opišite izazovan projekat i šta ste uradili.
A-SR: Recite kakav je bio problem, šta je bila vaša odgovornost, koje ste korake preduzeli i koji je bio merljiv ili proverljiv ishod. Ne izmišljajte rezultate.
Q-EN: Describe a challenging project and what you did.
A-EN: State the problem, your responsibility, the steps you took, and a measurable or observable result. Do not invent outcomes.
Source: Prepared practice prompt

## hr-disagreement
Category: HR
Aliases: team conflict; neslaganje u timu
Q-SR: Kako rešavate neslaganje u timu?
A-SR: Najpre razjasnite zajednički cilj i saslušajte drugu stranu. Zatim uporedite dokaze ili sprovedite mali eksperiment i objasnite kako ste se dogovorili o odluci.
Q-EN: How do you handle a disagreement on your team?
A-EN: Clarify the shared goal and listen to the other person. Compare evidence or run a small experiment, then explain how the team reached a decision.
Source: Prepared practice prompt

## java-collections
Category: Java
Aliases: list set map; java collections
Q-SR: Kada biste koristili List, Set i Map u Javi?
A-SR: List čuva redosled i dopušta duplikate, Set predstavlja jedinstvene elemente, a Map povezuje ključ sa vrednošću. Izbor zavisi od potrebnih operacija i pravila o duplikatima.
Q-EN: When would you use List, Set, and Map in Java?
A-EN: List keeps an ordered sequence and allows duplicates, Set models unique elements, and Map associates keys with values. Choose based on the operations and duplicate rules you need.
Source: https://docs.oracle.com/javase/tutorial/collections/interfaces/index.html

## java-concurrency
Category: Java
Aliases: race condition java; concurrency
Q-SR: Šta je race condition i kako biste ga sprečili?
A-SR: Race condition nastaje kada rezultat zavisi od redosleda istovremenih pristupa deljenom stanju. Koristio/la bih sinhronizaciju, atomske operacije ili uklonio/la deljeno promenljivo stanje.
Q-EN: What is a race condition and how would you prevent one?
A-EN: A race condition occurs when the result depends on the timing of concurrent access to shared state. Use synchronization, atomic operations, or remove shared mutable state.
Source: https://docs.oracle.com/javase/tutorial/essential/concurrency/sync.html

## react-props-state
Category: React
Aliases: props versus state; react state
Q-SR: Koja je razlika između props i state u Reactu?
A-SR: Props su podaci koje komponenta dobija spolja. State je njeno lokalno stanje koje se menja tokom rada; promena state-a pokreće novo renderovanje.
Q-EN: What is the difference between props and state in React?
A-EN: Props are inputs passed into a component. State is the component's own changing data; updating state triggers a render.
Source: https://react.dev/learn/state-a-components-memory

## react-effect
Category: React
Aliases: useEffect; react effect
Q-SR: Kada biste koristili useEffect u Reactu?
A-SR: Koristio/la bih ga kada komponenta mora da se sinhronizuje sa spoljnim sistemom, na primer mrežnom vezom ili browser API-jem. Ne treba ga koristiti samo za izračunavanje podataka koji mogu nastati tokom renderovanja.
Q-EN: When would you use useEffect in React?
A-EN: Use it to synchronize a component with an external system, such as a network connection or browser API. Avoid it for values you can calculate during rendering.
Source: https://react.dev/reference/react/useEffect

## python-generator
Category: Python
Aliases: python generator; yield
Q-SR: Šta je generator u Pythonu?
A-SR: Generator proizvodi vrednosti jednu po jednu, često pomoću yield, pa ne mora unapred da čuva ceo niz u memoriji. Koristan je za velike ili postepene tokove podataka.
Q-EN: What is a generator in Python?
A-EN: A generator yields values one at a time, often using yield, instead of storing the entire sequence up front. It is useful for large or incremental data streams.
Source: https://docs.python.org/3/tutorial/classes.html#generators

## dotnet-async
Category: .NET
Aliases: async await; csharp async
Q-SR: Šta async i await rešavaju u .NET aplikaciji?
A-SR: Omogućavaju da se čeka I/O bez blokiranja niti. To pomaže odzivnosti i propusnosti, ali ne znači da se CPU posao automatski izvršava paralelno.
Q-EN: What do async and await solve in a .NET application?
A-EN: They let code await I/O without blocking a thread. That helps responsiveness and throughput, but does not automatically make CPU work parallel.
Source: https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-scenarios

## devops-cicd
Category: DevOps
Aliases: ci cd; deployment pipeline
Q-SR: Kako biste objasnili CI i CD?
A-SR: CI često integriše promene i automatski pokreće build i testove. CD priprema ili automatski objavljuje proverene verzije kroz ponovljiv proces.
Q-EN: How would you explain CI and CD?
A-EN: CI integrates changes frequently and runs builds and tests automatically. CD prepares or deploys verified versions through a repeatable process.
Source: https://docs.github.com/en/actions/get-started/continuous-integration

## devops-container
Category: DevOps
Aliases: docker image container; containerisation
Q-SR: Koja je razlika između Docker image-a i containera?
A-SR: Image je nepromenljiv šablon aplikacije i njenih zavisnosti. Container je pokrenuta instanca image-a sa sopstvenim procesom i promenljivim stanjem.
Q-EN: What is the difference between a Docker image and a container?
A-EN: An image is a reusable template of an application and its dependencies. A container is a running instance of that image with its own process and writable state.
Source: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/

## frontend-cors
Category: Front-end
Aliases: cors; cross origin
Q-SR: Šta je CORS i kada nastaje problem s njim?
A-SR: CORS je browser mehanizam koji serveru omogućava da odredi koji drugi origin sme da čita odgovor. Problem nastaje kada browser blokira zahtev jer odgovor nema odgovarajuće CORS zaglavlje.
Q-EN: What is CORS and when does it cause a problem?
A-EN: CORS is a browser mechanism that lets a server declare which other origins may read its response. A problem appears when the browser blocks access because the response lacks the required CORS headers.
Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS

## sql-index
Category: Data analytics
Aliases: database index; sql index
Q-SR: Kako biste objasnili indeks u bazi podataka?
A-SR: Indeks pomaže upitu da pronađe redove bez skeniranja cele tabele. Ubrzava neka čitanja, ali zauzima prostor i može usporiti upise, pa korist treba meriti na stvarnim upitima.
Q-EN: How would you explain a database index?
A-EN: An index helps queries find rows without scanning the entire table. It can speed up reads, but consumes storage and adds write overhead, so its value should be measured on real queries.
Source: https://www.postgresql.org/docs/current/indexes.html

## analytics-missing
Category: Data analytics
Aliases: missing data; null values
Q-SR: Kako biste obradili nedostajuće vrednosti u skupu podataka?
A-SR: Najpre bih utvrdio/la zašto vrednosti nedostaju i koliko ih ima. Zatim bih odabrao/la uklanjanje, imputaciju ili posebno označavanje, uz proveru uticaja na analizu.
Q-EN: How would you handle missing values in a dataset?
A-EN: First determine why values are missing and how often. Then choose removal, imputation, or explicit missing-value handling, and check how the choice affects the analysis.
Source: https://pandas.pydata.org/docs/user_guide/missing_data.html

## systems-cache
Category: Systems
Aliases: caching; cache invalidation
Q-SR: Kada biste dodali keš i koji je najveći izazov?
A-SR: Keš bih dodao/la kada ponovljena čitanja opterećuju spor izvor podataka. Najveći izazov je zastarevanje: treba jasno odrediti kada i kako se podaci osvežavaju ili uklanjaju.
Q-EN: When would you add a cache, and what is the main challenge?
A-EN: Add a cache when repeated reads overload a slower data source. The main challenge is stale data: define when and how entries are refreshed or invalidated.
Source: https://redis.io/docs/latest/develop/use/patterns/
