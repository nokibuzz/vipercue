# Lokalna pitanja i odgovori / Offline interview answers

Kratki predlozi za vežbu intervjua. Odgovori su parafraze i namerno ne tvrde ništa o ličnom iskustvu kandidata. `Aliases` služe za lokalnu pretragu; svako pitanje ima srpsku i englesku verziju. Podudaranje nije semantičko razumevanje: kada je pitanje nejasno, aplikacija ne bira odgovor.

## java-list-set
Category: Java
Aliases: java list set; list vs set; difference list set; razlika list set; kolekcije list set
Q-SR: Koja je razlika između List i Set u Javi?
A-SR: List čuva redosled i dozvoljava duplikate; Set predstavlja jedinstvene elemente. Konkretna implementacija određuje redosled i performanse.
Q-EN: What is the difference between List and Set in Java?
A-EN: A List preserves element order and allows duplicates; a Set stores unique elements. Ordering and performance depend on the implementation.
Source: https://docs.oracle.com/en/java/javase/24/docs/api/java.base/java/util/doc-files/coll-overview.html

## java-hashmap
Category: Java
Aliases: hashmap java; hash map java; mapa kljuc vrednost java; java map key value
Q-SR: Kako radi HashMap u Javi?
A-SR: HashMap povezuje ključ sa vrednošću i koristi hash koda ključa da pronađe odgovarajuću lokaciju. Dobar `hashCode` i dosledan `equals` važni su za ispravno pronalaženje.
Q-EN: How does HashMap work in Java?
A-EN: HashMap associates keys with values and uses a key's hash code to find a bucket. Consistent `hashCode` and `equals` implementations are essential for correct lookups.
Source: https://docs.oracle.com/en/java/javase/24/docs/api/java.base/java/util/HashMap.html

## java-equals-hashcode
Category: Java
Aliases: equals hashcode; equals and hashcode; equals i hashcode; java equality hash
Q-SR: Zašto se equals i hashCode implementiraju zajedno?
A-SR: Ako su dva objekta jednaka po `equals`, moraju imati isti `hashCode`. Time hash kolekcije mogu pouzdano pronaći objekat koji smatraju jednakim.
Q-EN: Why must equals and hashCode be implemented together?
A-EN: Objects that are equal according to `equals` must have the same `hashCode`. Hash based collections rely on that contract for lookups.
Source: https://docs.oracle.com/en/java/javase/24/docs/api/java.base/java/lang/Object.html

## java-interface-abstract
Category: Java
Aliases: interface abstract class java; interface vs abstract class; interfejs apstraktna klasa
Q-SR: Kada biraš interfejs, a kada apstraktnu klasu?
A-SR: Interfejs opisuje ugovor koji mogu deliti različite klase. Apstraktna klasa je korisna kada povezane klase dele stanje ili zajedničku implementaciju.
Q-EN: When would you use an interface instead of an abstract class?
A-EN: An interface defines a contract that unrelated classes can implement. An abstract class is useful when related classes share state or implementation.
Source: https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html

## java-stream
Category: Java
Aliases: java stream api; streams java; stream map filter; java tokovi filter map
Q-SR: Čemu služi Java Stream API?
A-SR: Stream omogućava deklarativnu obradu niza elemenata kroz operacije poput `filter` i `map`, a terminalna operacija pokreće obradu. Ne menja automatski izvornu kolekciju.
Q-EN: What is Java Stream API used for?
A-EN: Streams process sequences declaratively with operations such as `filter` and `map`; a terminal operation triggers evaluation. They do not automatically mutate the source collection.
Source: https://docs.oracle.com/en/java/javase/24/docs/api/java.base/java/util/stream/package-summary.html

## react-props-state
Category: React
Aliases: react props state; props vs state; razlika props state; react stanje propovi
Q-SR: Koja je razlika između props i state u React-u?
A-SR: Props su ulazni podaci koje komponenta dobija od roditelja. State je podatak koji komponenta sama pamti i menja; promena state pokreće novo renderovanje.
Q-EN: What is the difference between props and state in React?
A-EN: Props are inputs passed from a parent. State is data a component remembers and updates itself; changing state triggers a render.
Source: https://react.dev/learn/state-a-components-memory

## react-useeffect
Category: React
Aliases: react useeffect; use effect react; kada koristiti useeffect; effect dependency react
Q-SR: Kada koristiš useEffect?
A-SR: `useEffect` sinhronizuje komponentu sa spoljnim sistemom, poput pretplate ili mrežne veze. Vrednosti koje se mogu izračunati iz props i state obično ne traže effect.
Q-EN: When should you use useEffect?
A-EN: `useEffect` synchronizes a component with an external system such as a subscription or network connection. Values derivable from props and state usually do not need an effect.
Source: https://react.dev/reference/react/useEffect

## react-keys
Category: React
Aliases: react keys list; key prop react; kljucevi react liste; stable keys react
Q-SR: Zašto su ključevi važni pri renderovanju liste?
A-SR: Stabilan `key` pomaže React-u da poveže element sa istim podatkom između renderovanja. Indeks liste može biti problem kada se redosled ili sadržaj menjaju.
Q-EN: Why are keys important when rendering a list?
A-EN: A stable `key` helps React match an item across renders. Array indexes can cause problems when items are inserted, removed or reordered.
Source: https://react.dev/learn/rendering-lists

## react-memo
Category: React
Aliases: react memo usememo; usememo vs memo; memoizacija react; react rendering optimization
Q-SR: Kada koristiš memo ili useMemo?
A-SR: `memo` može preskočiti render komponente kada su props isti, a `useMemo` pamti rezultat računanja. Koristim ih nakon merenja, jer ne rešavaju automatski problem sporog interfejsa.
Q-EN: When would you use memo or useMemo?
A-EN: `memo` can skip rendering when props are unchanged, while `useMemo` caches a calculation. I would use them after measuring a real bottleneck.
Source: https://react.dev/reference/react/memo

## react-controlled
Category: React
Aliases: controlled component react; controlled input; kontrolisana komponenta; react form state
Q-SR: Šta je kontrolisani input u React-u?
A-SR: Vrednost kontrolisanog inputa dolazi iz React state, a `onChange` ažurira taj state. To omogućava da validacija i prikaz prate jedan izvor istine.
Q-EN: What is a controlled input in React?
A-EN: A controlled input receives its value from React state and updates that state in `onChange`. This keeps validation and display tied to one source of truth.
Source: https://react.dev/reference/react-dom/components/input

## python-list-tuple
Category: Python
Aliases: python list tuple; list vs tuple python; razlika lista tuple; python mutable immutable sequence
Q-SR: Koja je razlika između liste i tuple u Pythonu?
A-SR: Lista je promenljiva sekvenca, a tuple je nepromenljiva. Tuple je dobar izbor za fiksan skup vrednosti, dok lista odgovara podacima koje menjamo.
Q-EN: What is the difference between a list and a tuple in Python?
A-EN: A list is mutable, while a tuple is immutable. Use a tuple for a fixed group of values and a list when the collection changes.
Source: https://docs.python.org/3/tutorial/datastructures.html

## python-dict
Category: Python
Aliases: python dictionary; python dict; recnik python; dict key value
Q-SR: Kako radi Python dictionary?
A-SR: Dictionary čuva parove ključ–vrednost i omogućava pristup po ključu. Ključevi moraju biti hashabilni, a svaki ključ je jedinstven u rečniku.
Q-EN: How does a Python dictionary work?
A-EN: A dictionary stores key–value pairs and retrieves values by key. Keys must be hashable and are unique within the dictionary.
Source: https://docs.python.org/3/tutorial/datastructures.html#dictionaries

## python-generator
Category: Python
Aliases: python generator yield; generator vs list python; generatori python; yield python
Q-SR: Zašto bi koristio generator u Pythonu?
A-SR: Generator proizvodi vrednosti po potrebi umesto da celu sekvencu čuva u memoriji. Koristan je za velike tokove podataka ili lenju obradu.
Q-EN: Why use a generator in Python?
A-EN: A generator yields values on demand instead of storing the whole sequence in memory. It is useful for large streams or lazy processing.
Source: https://docs.python.org/3/tutorial/classes.html#generators

## python-context-manager
Category: Python
Aliases: python context manager; with statement python; contextmanager python; upravljac kontekstom python
Q-SR: Čemu služi context manager i `with`?
A-SR: Context manager postavlja resurs pri ulasku u blok i oslobađa ga pri izlasku, čak i kada nastane greška. Tipičan primer je rad sa datotekama.
Q-EN: What is a context manager in Python?
A-EN: A context manager sets up a resource on entry and cleans it up on exit, including when an exception occurs. File handling is a common example.
Source: https://docs.python.org/3/library/contextlib.html

## python-exceptions
Category: Python
Aliases: python exception handling; try except finally; izuzeci python; python errors finally
Q-SR: Kako obrađuješ izuzetke u Pythonu?
A-SR: Hvatam očekivane tipove izuzetaka u `except`, a `finally` koristim za čišćenje koje mora da se desi. Široko hvatanje svih grešaka može sakriti problem.
Q-EN: How do you handle exceptions in Python?
A-EN: I catch expected exception types with `except` and use `finally` for cleanup that must run. Catching every exception broadly can hide bugs.
Source: https://docs.python.org/3/tutorial/errors.html

## dotnet-async-await
Category: .NET
Aliases: dotnet async await; csharp async await; c# task await; asinhrono dotnet
Q-SR: Šta rade async i await u C#?
A-SR: `async` omogućava metodi da koristi `await`, koji ne blokira nit dok čeka asinhronu operaciju. Rezultat se obično predstavlja kroz `Task` ili `Task<T>`.
Q-EN: What do async and await do in C#?
A-EN: `async` lets a method use `await`, which can wait for asynchronous work without blocking the thread. Results are commonly represented by `Task` or `Task<T>`.
Source: https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-scenarios

## dotnet-di-lifetimes
Category: .NET
Aliases: dotnet dependency injection lifetimes; singleton scoped transient; di lifetime csharp; zivotni vek servis dotnet
Q-SR: Koja je razlika između transient, scoped i singleton servisa?
A-SR: Transient se kreira pri svakom zahtevu za servis, scoped jednom po opsegu, a singleton jednom za ceo kontejner. Za singleton treba posebno paziti na deljeno promenljivo stanje.
Q-EN: What is the difference between transient, scoped and singleton services?
A-EN: Transient creates a service each time, scoped once per scope, and singleton once for the container. A singleton with shared mutable state needs careful synchronization.
Source: https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection#service-lifetimes

## dotnet-linq
Category: .NET
Aliases: linq deferred execution; csharp linq; dotnet linq query; odlozeno izvrsavanje linq
Q-SR: Šta znači odloženo izvršavanje u LINQ-u?
A-SR: Mnogi LINQ upiti samo opisuju obradu i izvrše se tek pri iteraciji. Ako treba trenutni rezultat, materijalizujem ga, na primer sa `ToList()`.
Q-EN: What does deferred execution mean in LINQ?
A-EN: Many LINQ queries describe work that runs only when the sequence is enumerated. To capture results immediately, materialize them with a method such as `ToList()`.
Source: https://learn.microsoft.com/en-us/dotnet/standard/linq/deferred-execution-lazy-evaluation

## dotnet-gc
Category: .NET
Aliases: dotnet garbage collector; csharp garbage collection; gc dotnet memory; sakupljanje smeca dotnet
Q-SR: Kako radi garbage collector u .NET-u?
A-SR: GC automatski oslobađa memoriju objekata koji više nisu dostupni programu. To ne zamenjuje pravovremeno oslobađanje spoljnjih resursa kao što su datoteke i konekcije.
Q-EN: How does garbage collection work in .NET?
A-EN: The GC reclaims memory for objects that are no longer reachable. External resources such as files and connections still need timely disposal.
Source: https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals

## dotnet-ienumerable-iqueryable
Category: .NET
Aliases: ienumerable iqueryable; iqueryable vs ienumerable; linq database query vs memory; dotnet upit baza memorija
Q-SR: Koja je razlika između IEnumerable i IQueryable?
A-SR: `IEnumerable` predstavlja sekvencu za iteraciju u .NET-u. `IQueryable` dodatno nosi izraz upita koji provajder, na primer ORM, može da prevede i izvrši nad izvorom podataka.
Q-EN: What is the difference between IEnumerable and IQueryable?
A-EN: `IEnumerable` is a sequence to enumerate in .NET. `IQueryable` also carries a query expression that a provider, such as an ORM, may translate and execute against a data source.
Source: https://learn.microsoft.com/en-us/dotnet/api/system.linq.iqueryable

## devops-image-container
Category: DevOps
Aliases: docker image container; container vs image; kontejner slika docker; docker image vs container
Q-SR: Koja je razlika između Docker image i kontejnera?
A-SR: Image je nepromenljiv paket aplikacije i zavisnosti. Kontejner je pokrenuta instanca image-a sa sopstvenim procesom i zapisivim slojem.
Q-EN: What is the difference between a Docker image and a container?
A-EN: An image is an immutable package of an application and its dependencies. A container is a running instance with its own process and writable layer.
Source: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/

## devops-dockerfile
Category: DevOps
Aliases: dockerfile build layers; docker image layers; slojevi dockerfile; optimizacija docker image
Q-SR: Kako bi smanjio Docker image?
A-SR: Koristio bih odgovarajuću malu baznu sliku, višefazni build i `.dockerignore`. Rasporedio bih slojeve tako da se zavisnosti ne instaliraju ponovo pri svakoj izmeni koda.
Q-EN: How would you make a Docker image smaller?
A-EN: I would use an appropriate small base image, a multistage build and `.dockerignore`. Layer ordering can also avoid reinstalling dependencies after every code change.
Source: https://docs.docker.com/build/building/best-practices/

## devops-kubernetes-deployment
Category: DevOps
Aliases: kubernetes pod deployment; pod vs deployment; razlika pod deployment; k8s replicas rollout
Q-SR: Koja je razlika između Pod i Deployment u Kubernetes-u?
A-SR: Pod je najmanja jedinica koja pokreće jedan ili više kontejnera. Deployment upravlja željenim brojem replika i postepenim ažuriranjem Pod-ova.
Q-EN: What is the difference between a Pod and a Deployment in Kubernetes?
A-EN: A Pod is the smallest unit that runs one or more containers. A Deployment manages the desired replicas and rolling updates of Pods.
Source: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/

## devops-cicd
Category: DevOps
Aliases: ci cd pipeline; continuous integration delivery deployment; kontinuirana integracija isporuka; devops pipeline
Q-SR: Šta su CI i CD?
A-SR: CI redovno integriše izmene i pokreće automatsku proveru. CD priprema ili automatski isporučuje proverene verzije, uz kontrolisane korake objave.
Q-EN: What are CI and CD?
A-EN: CI integrates changes frequently and runs automated checks. CD prepares or automatically releases validated builds through a repeatable pipeline.
Source: https://docs.github.com/en/actions/get-started/continuous-integration

## devops-iac
Category: DevOps
Aliases: infrastructure as code; terraform iac; infrastruktura kao kod; terraform plan apply
Q-SR: Šta je infrastructure as code?
A-SR: Infrastruktura se opisuje u verzionisanim deklarativnim datotekama umesto ručnih koraka. Alati poput Terraform-a mogu prikazati plan promene pre primene.
Q-EN: What is infrastructure as code?
A-EN: Infrastructure is described in versioned configuration instead of manual steps. Tools such as Terraform can show a change plan before applying it.
Source: https://developer.hashicorp.com/terraform/intro/core-workflow

## frontend-event-loop
Category: Front-end
Aliases: javascript event loop; js event loop; petlja dogadjaja javascript; microtask task javascript
Q-SR: Kako radi JavaScript event loop?
A-SR: JavaScript izvršava posao po redosledu događaja i zadataka, a asinhroni rezultat kasnije stavlja posao u red. Duga sinhrona operacija i dalje blokira glavnu nit.
Q-EN: How does the JavaScript event loop work?
A-EN: JavaScript runs queued jobs one at a time and schedules asynchronous continuations for later. Long synchronous work still blocks the main thread.
Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model

## frontend-promise
Category: Front-end
Aliases: javascript promise async await; js promises; obecanje async await; promise resolve reject
Q-SR: Šta je Promise i kako se koristi sa async/await?
A-SR: Promise predstavlja budući uspeh ili grešku asinhrone operacije. `await` čini kod čitljivijim dok čeka rezultat, a greške se obrađuju kroz `try/catch`.
Q-EN: What is a Promise and how does async/await use it?
A-EN: A Promise represents the eventual success or failure of asynchronous work. `await` reads sequentially while waiting for it, and errors can be handled with `try/catch`.
Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

## frontend-css-box
Category: Front-end
Aliases: css box model; box model css; css margin padding border; model kutije css
Q-SR: Šta čini CSS box model?
A-SR: Element ima sadržaj, padding, border i marginu. Sa `box-sizing: border-box`, zadate širina i visina uključuju padding i border.
Q-EN: What makes up the CSS box model?
A-EN: An element has content, padding, border and margin. With `box-sizing: border-box`, the declared width and height include padding and border.
Source: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model

## frontend-flex-grid
Category: Front-end
Aliases: css flex grid; flexbox vs grid; flex i grid razlika; layout one two dimensions
Q-SR: Kada koristiš Flexbox, a kada CSS Grid?
A-SR: Flexbox je prirodan za raspored po jednoj osi, na primer red dugmadi. Grid bolje opisuje raspored po redovima i kolonama istovremeno.
Q-EN: When would you use Flexbox instead of CSS Grid?
A-EN: Flexbox is suited to layout along one axis, such as a row of controls. Grid is better when rows and columns both define the layout.
Source: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Relationship_of_grid_layout_with_other_layout_methods

## frontend-cors
Category: Front-end
Aliases: cors browser; cross origin resource sharing; cors error; politika istog porekla cors
Q-SR: Šta je CORS?
A-SR: CORS je mehanizam HTTP zaglavlja kojim server dozvoljava pregledaču čitanje resursa sa drugog porekla. Problem se obično rešava pravilnim odgovorom servera, ne samo promenom front-end koda.
Q-EN: What is CORS?
A-EN: CORS is an HTTP header mechanism that lets a server permit a browser to read resources from another origin. Fixes usually require the server to return the right headers.
Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS

## data-sql-index
Category: Data analytics
Aliases: database index; sql index; indeks baze; indeks sql; what is index database
Q-SR: Šta je indeks u bazi podataka?
A-SR: Indeks ubrzava pronalaženje redova za odgovarajuće upite bez potpunog skeniranja tabele. Troši prostor i dodaje posao pri upisu, pa ga treba meriti na stvarnim upitima.
Q-EN: What is a database index?
A-EN: An index helps relevant queries find rows without scanning the whole table. It uses storage and adds write overhead, so its value should be measured on real queries.
Source: https://www.postgresql.org/docs/current/indexes.html

## data-sql-optimize
Category: Data analytics
Aliases: optimize sql query; slow sql query; optimizacija sql upita; spor sql upit; query execution plan
Q-SR: Kako biste optimizovali spor SQL upit?
A-SR: Počeo/la bih od plana izvršavanja da vidim skupe korake, pa proverio/la indekse, filtere i količinu pročitanih podataka. Posle izmene bih ponovo izmerio/la vreme i uticaj na upise.
Q-EN: How would you optimize a slow SQL query?
A-EN: I would inspect the execution plan, then check indexes, filters and how much data the query reads. After a change, I would measure latency and write overhead again.
Source: https://www.postgresql.org/docs/current/using-explain.html

## data-sql-join
Category: Data analytics
Aliases: sql join types; inner join left join; sql inner left join razlika; spajanje tabela sql
Q-SR: Koja je razlika između INNER JOIN i LEFT JOIN?
A-SR: INNER JOIN vraća samo redove koji se podudaraju u obe tabele. LEFT JOIN zadržava sve redove leve tabele i popunjava nedostajuće vrednosti desne strane sa `NULL`.
Q-EN: What is the difference between INNER JOIN and LEFT JOIN?
A-EN: INNER JOIN returns rows matched on both sides. LEFT JOIN keeps every row from the left table and uses `NULL` for unmatched right side values.
Source: https://www.postgresql.org/docs/current/queries-table-expressions.html

## data-group-having
Category: Data analytics
Aliases: sql group by having; where vs having; grupisanje having sql; aggregate filter sql
Q-SR: Koja je razlika između WHERE i HAVING?
A-SR: `WHERE` filtrira redove pre grupisanja. `HAVING` filtrira grupe nakon agregacije, na primer grupe sa više od deset zapisa.
Q-EN: What is the difference between WHERE and HAVING?
A-EN: `WHERE` filters rows before grouping. `HAVING` filters groups after aggregation, such as groups with more than ten rows.
Source: https://www.postgresql.org/docs/current/queries-table-expressions.html

## data-etl-elt
Category: Data analytics
Aliases: etl elt difference; etl vs elt; extract transform load; razlika etl elt
Q-SR: Koja je razlika između ETL i ELT?
A-SR: ETL transformiše podatke pre učitavanja u cilj. ELT prvo učita podatke, pa transformaciju radi u ciljnom sistemu; izbor zavisi od kapaciteta i pravila upravljanja podacima.
Q-EN: What is the difference between ETL and ELT?
A-EN: ETL transforms data before loading it into the target. ELT loads first and transforms inside the target system; the choice depends on capacity and data governance.
Source: https://learn.microsoft.com/en-us/azure/architecture/data-guide/relational-data/etl

## data-missing-values
Category: Data analytics
Aliases: missing data analysis; pandas missing values; nedostajuce vrednosti; null values dataset
Q-SR: Kako obrađuješ nedostajuće vrednosti u podacima?
A-SR: Prvo proveravam obim i razlog nedostajanja, pa biram brisanje, imputaciju ili posebnu kategoriju u skladu sa ciljem analize. Postupak dokumentujem i proveravam uticaj na rezultat.
Q-EN: How do you handle missing values in a dataset?
A-EN: I first inspect how much data is missing and why, then choose deletion, imputation or a separate category based on the analysis goal. I document the choice and test its effect.
Source: https://pandas.pydata.org/docs/user_guide/missing_data.html

## systems-cache
Category: Systems
Aliases: cache caching; kesiranje podataka; cache invalidation; how cache works
Q-SR: Šta je keširanje i koji je glavni izazov?
A-SR: Keš čuva često korišćene podatke bliže aplikaciji i smanjuje kašnjenje. Glavni izazov je da se podaci osveže ili uklone kada više nisu važeći.
Q-EN: What is caching and what is its main challenge?
A-EN: Caching keeps frequently used data closer to the application to reduce latency. The main challenge is invalidating or refreshing stale data.
Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching

## systems-rest
Category: Systems
Aliases: rest api; restful api; rest http methods; restful endpoint
Q-SR: Šta je REST API?
A-SR: REST API izlaže resurse preko HTTP zahteva, obično koristeći metode kao što su GET, POST, PUT i DELETE. Zahtevi su bez serverskog stanja sesije, a odgovori nose reprezentaciju resursa.
Q-EN: What is a REST API?
A-EN: A REST API exposes resources through HTTP requests, commonly using GET, POST, PUT and DELETE. Requests are stateless and responses represent resources.
Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview

## systems-race
Category: Systems
Aliases: race condition; uslov trke; trka podataka; concurrency race
Q-SR: Šta je race condition?
A-SR: Rezultat zavisi od redosleda istovremenih operacija nad deljenim stanjem. Rešenje može biti zaključavanje, atomska operacija ili uklanjanje deljenog promenljivog stanja.
Q-EN: What is a race condition?
A-EN: The result depends on the timing of concurrent operations over shared state. Locks, atomic operations or avoiding shared mutable state can prevent it.
Source: https://docs.oracle.com/javase/tutorial/essential/concurrency/syncrgb.html

## systems-deadlock
Category: Systems
Aliases: deadlock threads; mrtva blokada; two locks deadlock; deadlock concurrency
Q-SR: Šta je deadlock i kako ga sprečiti?
A-SR: Deadlock nastaje kada operacije čekaju jedna na drugu i nijedna ne napreduje. Dosledan redosled zaključavanja i kraće kritične sekcije smanjuju rizik.
Q-EN: What is a deadlock and how can it be prevented?
A-EN: A deadlock occurs when operations wait on each other and none can proceed. Consistent lock ordering and shorter critical sections reduce the risk.
Source: https://docs.oracle.com/javase/tutorial/essential/concurrency/deadlock.html

## systems-load-balancer
Category: Systems
Aliases: load balancer; load balancing; raspodela opterecenja; distribute traffic servers
Q-SR: Čemu služi load balancer?
A-SR: Raspoređuje dolazne zahteve između više instanci servisa i može izbaciti nezdrave instance iz saobraćaja. Time se poboljšavaju dostupnost i iskorišćenost kapaciteta.
Q-EN: What does a load balancer do?
A-EN: It distributes incoming requests across service instances and can stop sending traffic to unhealthy ones. This improves availability and capacity use.
Source: https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html

## hr-about-yourself
Category: HR
Aliases: tell me about yourself; reci nesto o sebi; predstavite se; introduce yourself
Q-SR: Recite mi nešto o sebi.
A-SR: Bavim se [vaša oblast] i najviše iskustva imam u [relevantna veština]. U ovoj ulozi želim da primenim to iskustvo na [konkretan cilj pozicije].
Q-EN: Tell me about yourself.
A-EN: I work in [your field], with most of my experience in [relevant skill]. I am interested in applying that background to [specific goal of this role].
Source: editorial-template

## hr-strengths
Category: HR
Aliases: greatest strength; biggest strength; strongest skill; najveca snaga; koje su jake strane
Q-SR: Koja je vaša najveća prednost?
A-SR: Moja prednost je [konkretna veština]. Na projektu [vaš primer] ona mi je pomogla da postignem [stvarni rezultat].
Q-EN: What is your greatest strength?
A-EN: One strength is [specific skill]. In [your real example], it helped me achieve [actual result].
Source: editorial-template

## hr-weakness
Category: HR
Aliases: greatest weakness; biggest weakness; slabost intervju; area to improve
Q-SR: Koja je vaša najveća slabost?
A-SR: Radim na [stvarna oblast za napredak]. Uveo/la sam [konkretan korak] i pratim da li mi to poboljšava rezultat.
Q-EN: What is your greatest weakness?
A-EN: I am working on [real area to improve]. I have started [concrete action] and track whether it improves my results.
Source: editorial-template

## hr-conflict
Category: HR
Aliases: conflict with colleague; disagreement at work; neslaganje sa kolegom; team conflict
Q-SR: Kako rešavate neslaganje u timu?
A-SR: Najpre razjasnim cilj i saslušam drugu stranu, pa tražim podatke ili mali eksperiment koji može rešiti spor. Ako odluka ostane otvorena, dogovorimo vlasnika i rok.
Q-EN: How do you handle a disagreement in a team?
A-EN: I clarify the goal and listen to the other view, then look for evidence or a small experiment to resolve the disagreement. If needed, we agree on an owner and deadline.
Source: editorial-template

## hr-challenge
Category: HR
Aliases: difficult challenge at work; challenging project; teska situacija posao; tell me challenge
Q-SR: Opišite izazov koji ste rešili.
A-SR: U [stvarnom projektu] problem je bio [problem]. Moj korak je bio [akcija], a rezultat [merljiv ili proverljiv ishod].
Q-EN: Tell me about a challenge you solved.
A-EN: In [real project], the challenge was [problem]. I took [action], and the result was [measurable or verifiable outcome].
Source: editorial-template

## hr-why-role
Category: HR
Aliases: why this role; why this company; zasto ova pozicija; zasto nasa kompanija; why apply now
Q-SR: Zašto želite ovu poziciju?
A-SR: Privlači me [konkretan deo posla] i vidim vezu sa svojim iskustvom u [stvarna oblast]. Želeo/la bih da doprinesem [realan cilj tima].
Q-EN: Why are you interested in this role?
A-EN: I am interested in [specific part of the role], which connects with my experience in [real area]. I would like to contribute to [real team goal].
Source: editorial-template
