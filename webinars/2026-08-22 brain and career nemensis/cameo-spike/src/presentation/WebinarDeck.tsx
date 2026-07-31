import {
  Deck,
  Slide,
  Heading,
  Text,
  Quote,
  FlexBox,
  Box,
  UnorderedList,
  OrderedList,
  ListItem,
  Notes,
} from 'spectacle';
import { webinarTheme } from './presentationTheme';
import './presentation.css';

const HRANA_PAIRS: Array<[string, string]> = [
  ['Cíl', 'možné × vysněné'],
  ['Identita', 'co mě baví × v čem exceluju'],
  ['Kroky', 'bezpečné × směřující k průlomu'],
  ['Důvěra v AI', 'příliš málo × příliš moc'],
  ['Plán', 'žádný × příliš detailní'],
  ['Značka', 'obecná × konkrétní'],
  ['Koučink', 'sebezkoumání × hotová instrukce'],
  ['Priority', 'rodina × práce, výkon × zdraví'],
];

export type WebinarDeckProps = {
  focusActive: boolean;
};

const SECTION_COUNT = 5;

/** Numbered divider badge ("BLOK n / 5") -- one per section from APPROVED_OUTLINE.md. */
function SectionBadge({ index }: { index: number }) {
  return (
    <>
      <Text
        color="tertiary"
        fontSize="1rem"
        fontWeight={600}
        margin="0 0 12px"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
        }}
      >
        Blok {index} / {SECTION_COUNT}
      </Text>
      <Box backgroundColor="tertiary" style={{ width: 48, height: 2, marginBottom: 20 }} />
    </>
  );
}

/**
 * Real webinar deck ("Co udělat pro svůj mozek a kariéru v IT v době AI"),
 * structured around the 5 numbered sections in APPROVED_OUTLINE.md (each
 * opens with a SectionBadge divider slide). Slides stay minimal on purpose --
 * the detailed talking points, exercise scripts, and ⚡ Hrana call-outs live
 * in <Notes> for the presenter, not on screen.
 */
export function WebinarDeck({ focusActive }: WebinarDeckProps) {
  return (
    <div className="presentation-layer" data-testid="presentation-layer" data-focus-active={focusActive}>
      <Deck theme={webinarTheme}>
        {/* 0. Title */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="primary" fontSize="2.4rem" textAlign="center" width="85%">
              Co udělat pro svůj mozek a kariéru v IT v době{' '}
              <span style={{ color: '#dbb155', fontStyle: 'italic' }}>AI</span>
            </Heading>
            <Text color="tertiary" fontSize="1.5rem">
              pohledem kouče
            </Text>
            <Text color="quaternary" margin="32px 0 0" fontSize="2.1rem">
              🖊️ Přineste si tužku a papír
            </Text>
          </FlexBox>
          <Notes>
            Praktický webinář pro lidi v IT a AI. Některé odpovědi dnes nevzniknou na obrazovce.
            Skrytý motiv celého webináře: napříč blokem se opakuje jeden tvar uvažování (⚡ Hrana) --
            místo kompromisu mezi dvěma póly hledáme přesný bod, kde se obě strany posilují. Objevuje
            se u cílů, důvěry v AI, plánování i osobní značky. Nahlas se pojmenuje až v bloku 5, aby si
            ho publikum odneslo jako přenositelný nástroj, ne jen jako sadu příkladů.
          </Notes>
        </Slide>

        {/* 1. Agenda */}
        <Slide backgroundColor="quinary">
          <Heading color="primary">Co si dnes projdeme</Heading>
          <OrderedList color="primary">
            <ListItem>Ajťák a jeho práce dnes</ListItem>
            <ListItem>AI + mozek = ?</ListItem>
            <ListItem>Jak na to jít celkově</ListItem>
            <ListItem>Ochutnávka pro Tebe</ListItem>
          </OrderedList>
          <Notes>
            Orientační časový rámec: 0. Otevření 5 min, 1. Co se děje ajťákovi 10 min, 2. Mozek a AI --
            výzkum + doporučení 18 min, 3. Dvě případové studie 15 min, 4. Zamiř/Zvaž/Zaber 20 min,
            5. Závěr + odlehčená tečka 8 min, Q&A 15--20 min. Celkem cca 92--97 min.
          </Notes>
        </Slide>

       {/* 2. Section 1 -- title */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <SectionBadge index={1} />
            <Heading color="primary" textAlign="center">
              Ajťák a jeho práce dnes
            </Heading>
            <Text color="quaternary" textAlign="center" width="70%" margin="24px 0 0">
              Očekávání bez hranic
            </Text>
          </FlexBox>
          <Notes>
            Otevírá první blok podle APPROVED_OUTLINE.md: AI mění pracovní náplň, očekávání i hodnotu
            některých dovedností. FOMO, přetížení a pocit, že je stále potřeba něco dohánět.
          </Notes>
        </Slide>
        {/* 3. Placeholder -- Nestačí mít dobrou motivaci */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Text color="quaternary" fontSize="1.3rem" textAlign="center" style={{ fontStyle: 'italic' }}>
              Nestačí mít dobrou motivaci
            </Text>
            <Heading color="primary" fontSize="2.2rem" textAlign="center" margin="24px 0 0">
              Je potřeba mít jasný positioning
            </Heading>
          </FlexBox>
          <Notes>
            Placeholder -- rozpracovat. Původní poznámka: "Nestačí být mít dobrou motivaci =&gt; je
            potřeba mít jasný positioning"
          </Notes>
        </Slide>

        {/* 4. Placeholder -- Nestačí dělat, co přijde normální */}
        <Slide backgroundColor="quinary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Text color="quaternary" fontSize="1.3rem" textAlign="center" style={{ fontStyle: 'italic' }}>
              Nestačí dělat tolik, co mi přijde normální
            </Text>
            <Heading color="primary" fontSize="2.2rem" textAlign="center" margin="24px 0 0">
              Je potřeba radikálně přidávat hodnotu
            </Heading>
          </FlexBox>
          <Notes>
            Placeholder -- rozpracovat. Původní poznámka: "Nestačí dělat tolik, co mi přijde normální
            nebo co mi přijde zrychleně normální =&gt; je potřeba radikálně přidávat hodnotu"
          </Notes>
        </Slide>

        {/* 5. Placeholder -- Nestačí poslat životopis */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Text color="quaternary" fontSize="1.3rem" textAlign="center" style={{ fontStyle: 'italic' }}>
              Nestačí poslat životopis a čekat, že se něco stane
            </Text>
            <Heading color="primary" fontSize="2.2rem" textAlign="center" margin="24px 0 0">
              Je nutné opečovávat kontakty a síť
            </Heading>
          </FlexBox>
          <Notes>
            Placeholder -- rozpracovat. Původní poznámka: "Nestačí poslat životopis a čekat, že se něco
            stane =&gt; je nutné opečovávat kontakty a síť"
          </Notes>
        </Slide>

        {/* 6. Placeholder -- Nestačí to dohnat školením */}
        <Slide backgroundColor="quinary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Text color="quaternary" fontSize="1.3rem" textAlign="center" style={{ fontStyle: 'italic' }}>
              Nestačí to dohnat školením
            </Text>
            <Heading color="primary" fontSize="2.2rem" textAlign="center" margin="24px 0 0">
              Někdy je potřeba komplexní změna
            </Heading>
          </FlexBox>
          <Notes>
            Placeholder -- rozpracovat. Původní poznámka: "Nestačí to dohnat školením =&gt; někdy je
            potřeba komplexní změna"
          </Notes>
        </Slide>

        {/* 7. Placeholder -- Nestačí to dohnat po nocích */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Text color="quaternary" fontSize="1.3rem" textAlign="center" style={{ fontStyle: 'italic' }}>
              Nestačí to jen dohnat po nocích
            </Text>
            <Heading color="primary" fontSize="2.2rem" textAlign="center" margin="24px 0 0">
              Duševní svěžest je zcela zásadní
            </Heading>
          </FlexBox>
          <Notes>
            Placeholder -- rozpracovat. Původní poznámka: "Nestačí to někdy jen dohnat po nocích =&gt;
            duševní svěžest je zcela zásadní"
          </Notes>
        </Slide>

        {/* 8. Hook */}
        <Slide backgroundColor="quinary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Quote
              color="primary"
              fontSize="1.6rem"
              textAlign="center"
              style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'normal', fontWeight: 500 }}
            >
              "Zajímavé technologie. Řešení reálných problémů. Možnost se učit."
            </Quote>
            <Heading color="tertiary" fontSize="2.2rem" margin="40px 0 0">
              Kdo dnes umí snít?
            </Heading>
          </FlexBox>
          <Notes>
            Tahle odpověď nemá informační hodnotu -- nikdo by přece nechtěl opak. Za obecností je
            strach: konkrétní přání = riziko zavřených dveří. Výsledek: signál dost obecný, aby
            nikoho neodradil -- a proto nikoho nezaujme. 200 odeslaných životopisů, 3 zamítnutí, ticho.
            ⚡ Hrana: snaha být bezpečně obecný dělá paradoxně neviditelným pro všechny -- specifičnost,
            která se zdá riskantní, riziko ve skutečnosti snižuje. Osobní odhalení: vlastní odchod od
            korporátního leadershipu a hands-on AI práce do koučování -- kdo tohle vede, si tím sám
            prošel. Slib webináře: jak si přiznat, kam chci jít, a vyslat signál, podle kterého mě
            najdou správní lidé. Most dál: tenhle strach ze specifičnosti znovu potkáme v cvičení
            "Zamiř jasně".
          </Notes>
        </Slide>

 
        {/* 9. Block 1 -- co se děje ajťákovi */}
        <Slide backgroundColor="quinary">
          <Heading color="primary">Co se dnes děje s ajťákem?</Heading>
          <Text color="quaternary" margin="0 0 16px">
            AI mění náplň práce rychleji, než ji stíháme zpracovat.
          </Text>
          <UnorderedList color="primary">
            <ListItem>Ignorovat</ListItem>
            <ListItem>Panicky sbírat kurzy a nástroje</ListItem>
            <ListItem>Slepě spolehnout na AI</ListItem>
            <ListItem>Vědomě se zorientovat -- tam směřujeme</ListItem>
          </UnorderedList>
          <Notes>
            Nároky rostou rychleji než naše kapacita se v nich zorientovat -&gt; FOMO, přetížení, pocit
            permanentního dohánění. Čtyři typické reakce (výše) -- reakce 3 "slepě spolehnout" má oporu
            ve výzkumu jako automation complacency (lidský dohled přestane fungovat), viz blok 2. Proč
            víc nástrojů a školení samo o sobě nepřinese víc klidu -- přidává jen další vstupy do
            přetíženého systému. ⚡ Hrana: řešení přetížení není přidat další vstup, ale najít, co
            odebrat. Neměla to být přitom poměrně klidná práce, která zaplatí hypotéku?
          </Notes>
        </Slide>

        {/* 10. Block 1 -- exercise */}
        <Slide backgroundColor="tertiary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Text color="secondary" fontSize="1rem" margin="0 0 8px">
              60 sekund
            </Text>
            <Heading color="secondary" fontSize="2rem" textAlign="center">
              Co mě dnes v práci skutečně zatěžuje --
              <br />a co jen automaticky považuji za problém?
            </Heading>
          </FlexBox>
          <Notes>
            60 s ticha na psaní. Most dál: reakce č. 3 (slepé spoléhání) je most k dalšímu bloku -- tam
            na výzkumu o lidech spolupracujících s AI ukážeme, proč se to děje a co s tím.
          </Notes>
        </Slide>

        {/* 11. Section 2 -- title */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <SectionBadge index={2} />
            <Heading color="primary" textAlign="center">
              Jak funguje mozek v prostředí neustálé změny
            </Heading>
            <Text color="quaternary" textAlign="center" width="70%" margin="24px 0 0">
              Mozek není oddělený od zbytku člověka -- výkon ovlivňuje energie, vztahy, zdraví i pocit
              smyslu.
            </Text>
          </FlexBox>
          <Notes>
            Tenhle blok jde dál: co konkrétně se děje, když se s AI radíme každý den, podložené
            výzkumem human-AI interakce (viz Q&amp;A příprava na konci pro přesné rozlišení, co je ve
            zdroji podložené a co ne).
          </Notes>
        </Slide>

        {/* 12-1a. Pár 1/5 -- problém: cognitive miser */}
        <Slide backgroundColor="quinary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="primary" textAlign="center" fontSize="2.2rem">
              Tvůj mozek hledá zkratky. AI mu je servíruje na podnose.
            </Heading>
            <Text color="quaternary" textAlign="center" width="75%" margin="24px 0 0" fontSize="1.2rem">
              Proto ti první návrh, co uvidíš, bude připadat správný -- ať je jakýkoli.
            </Text>
            <Text color="quaternary" textAlign="center" margin="32px 0 0" fontSize="0.85rem" style={{ opacity: 0.7 }}>
              (Romeo &amp; Conti, 2026)
            </Text>
          </FlexBox>
          <Notes>
            Termín: automation bias -- u "mechanických" úkolů automaticky přebíráme AI výstup bez
            kontroly, mozek je "cognitive miser" a šetří energii, kde to jde. ⚡ Hrana: důvěra v AI
            funguje jako hledání cíle -- příliš málo i příliš moc důvěry škodí, cíl je trefit přesnou
            hranu skutečné spolehlivosti systému. Zdroj: HUMAN_AI_INTERACTION_RESEARCH.md, sekce 2
            (Automation Bias a Cognitive Reliance) -- cognitive miser hypotéza i dva typy chyb jsou ve
            zdroji přímo. Doplňková akademická citace: Romeo, G., &amp; Conti, D. (2026). Exploring
            automation bias in human-AI collaboration: a review and implications for explainable AI. AI
            &amp; SOCIETY, 41, 259-278. Plné reference viz slide "Zdroje" na konci.
          </Notes>
        </Slide>

        {/* 12-1b. Pár 1/5 -- lék: human-first protokol */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="primary" textAlign="center" fontSize="2.2rem">
              Než se zeptáš AI, zeptej se sebe.
            </Heading>
            <Text color="quaternary" textAlign="center" width="75%" margin="24px 0 0" fontSize="1.2rem">
              Vlastní odhad napřed tě ochrání před tím, že jen přikývneš na první nabídku.
            </Text>
          </FlexBox>
          <Notes>
            Human-first protokol: vlastní odhad před AI návrhem. Chrání před ukotvením (anchoring).
            Zdroj: HUMAN_AI_INTERACTION_RESEARCH.md, sekce 7 (Human-Centered Oversight and Frictional
            Design) -- "Human-First Protocols" jsou ve zdroji doslova, včetně vazby na anchoring.
          </Notes>
        </Slide>

        {/* 12-2a. Pár 2/5 -- problém: dva typy chyb */}
        <Slide backgroundColor="quinary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="primary" textAlign="center" fontSize="2.2rem">
              S AI se dá splést dvěma způsoby.
            </Heading>
            <Text color="quaternary" textAlign="center" width="75%" margin="24px 0 0" fontSize="1.2rem">
              Buď převezmeš špatnou radu. Nebo si nevšimneš, že žádnou nedostal.
            </Text>
            <Text color="quaternary" textAlign="center" margin="32px 0 0" fontSize="0.85rem" style={{ opacity: 0.7 }}>
              (Romeo &amp; Conti, 2026)
            </Text>
          </FlexBox>
          <Notes>
            Chyba z přijetí (aktivně přeberu špatný návrh) vs. z opomenutí (neudělám nic, protože AI
            problém neoznačila). Zdroj: HUMAN_AI_INTERACTION_RESEARCH.md, sekce 2 -- "Errors of
            Commission and Errors of Omission" jsou ve zdroji přímo jako dvě modality reliance failures.
            Doplňková akademická citace: Romeo, G., &amp; Conti, D. (2026). Exploring automation bias in
            human-AI collaboration: a review and implications for explainable AI. AI &amp; SOCIETY, 41,
            259-278.
          </Notes>
        </Slide>

        {/* 12-2b. Pár 2/5 -- lék: vědomá pauza */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="primary" textAlign="center" fontSize="2.2rem">
              U rizikových věcí -- zastav se.
            </Heading>
            <Text color="quaternary" textAlign="center" width="75%" margin="24px 0 0" fontSize="1.2rem">
              Pár vteřin ticha rozhodne, jestli tu chybu vůbec uvidíš.
            </Text>
            <Text color="quaternary" textAlign="center" margin="32px 0 0" fontSize="0.85rem" style={{ opacity: 0.7 }}>
              (Cabitza a kol., 2024)
            </Text>
          </FlexBox>
          <Notes>
            Vědomá pauza u rizikových úkolů. ⚡ Hrana: schválně zpomalit zní jako špatný UX, ale chrání
            kvalitu rozhodování -- pohodlí a kvalita úsudku jdou proti sobě, zpomalit přesně tam, kde to
            má váhu. Zdroj: HUMAN_AI_INTERACTION_RESEARCH.md, sekce 7 (Human-Centered Oversight and
            Frictional Design) -- Cognitive Forcing Functions (CFFs) a Frictional AI, model "Pro-hoc"
            podle Cabitza a kol. (2024): AI nesmí radit jako první, protože to ukotví úsudek na jejím
            závěru. ⚠️ Přesná bibliografická citace není v poskytnutém seznamu zdrojů -- doplnit a ověřit
            před citováním na živo.
          </Notes>
        </Slide>

        {/* 12-3a. Pár 3/5 -- problém: střední znalost */}
        <Slide backgroundColor="quinary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="primary" textAlign="center" fontSize="2.2rem">
              Nebezpečný nejsi jako začátečník.
            </Heading>
            <Text color="quaternary" textAlign="center" width="75%" margin="24px 0 0" fontSize="1.2rem">
              Nebezpečný jsi ve chvíli, kdy si myslíš, že už to umíš.
            </Text>
            <Text color="quaternary" textAlign="center" margin="32px 0 0" fontSize="0.85rem" style={{ opacity: 0.7 }}>
              (Kim a kol., 2026)
            </Text>
          </FlexBox>
          <Notes>
            Dunning-Krugerův efekt -- lidé se středními znalostmi o AI jsou nejnáchylnější k nadměrné
            důvěře; experti naopak trpí algoritmickou averzí a chybami z opomenutí pod tlakem času.
            Zdroj: HUMAN_AI_INTERACTION_RESEARCH.md, sekce 3 -- koncept Dunning-Kruger u "Moderate
            Knowledge Users" je ve zdroji. ⚠️ Citace "Horowitz a Kahn, 2024" NENÍ ověřená ani vůči
            internímu zdroji, ani vůči akademickému seznamu -- na živo nejmenovat tyto konkrétní autory.
            Efekt má navíc dlouhodobě spornou metodologickou pověst (možná regrese k průměru). Místo toho
            citovat: Kim, T. W., Usman, U., Garvey, A., &amp; Duhachek, A. (2026). From algorithm
            aversion to AI dependence: Deskilling, upskilling, and emerging addictions in the GenAI age.
            Consumer Psychology Review, 9(1), 142-164 -- pokrývá přesně tenhle jev (skeptičtí experti vs.
            přehnaně důvěřiví středně znalí uživatelé).
          </Notes>
        </Slide>

        {/* 12-3b. Pár 3/5 -- lék: ptejte se na příklady */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="primary" textAlign="center" fontSize="2.2rem">
              Nespokoj se s vysvětlením. Chtěj příklad.
            </Heading>
            <Text color="quaternary" textAlign="center" width="75%" margin="24px 0 0" fontSize="1.2rem">
              Příklad tě donutí přemýšlet. Vysvětlení tě jen ukolébá.
            </Text>
            <Text color="quaternary" textAlign="center" margin="32px 0 0" fontSize="0.85rem" style={{ opacity: 0.7 }}>
              (Cabitza a kol., 2024)
            </Text>
          </FlexBox>
          <Notes>
            Ptejte se na příklady, ne jen na vysvětlení. Analogické uvažování posiluje expertní úsudek a
            brání odbourávání dovedností víc než dlouhé vysvětlení "proč". Zdroj:
            HUMAN_AI_INTERACTION_RESEARCH.md, sekce 6 a 7 -- "example-based" vysvětlení a "Analogous Case
            Presentation" jsou ve zdroji přímo spojené s analogickým uvažováním a nižším de-skillingem,
            jako třetí intervence stejného modelu "Pro-hoc" (Cabitza a kol., 2024) jako u předchozích dvou
            slidů. ⚠️ Přesná bibliografická citace není v poskytnutém seznamu zdrojů -- doplnit a ověřit.
          </Notes>
        </Slide>

        {/* 12-4a. Pár 4/5 -- problém: přesnost se hroutí */}
        <Slide backgroundColor="quinary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="primary" textAlign="center" fontSize="2.2rem">
              Tvoje přesnost se může zhroutit, aniž bys to poznal.
            </Heading>
            <Text color="quaternary" textAlign="center" width="75%" margin="24px 0 0" fontSize="1.2rem">
              Radiologové s AI: z 79,7 % na 19,8 % správných diagnóz. Nikdo z nich to necítil.
            </Text>
            <Text color="quaternary" textAlign="center" margin="32px 0 0" fontSize="0.85rem" style={{ opacity: 0.7 }}>
              (Dratsch a kol., 2023)
            </Text>
          </FlexBox>
          <Notes>
            Dratsch a kol., 2023 -- jedna studie. Přeneseno do IT: co se stane s juniorem, který
            nekriticky přebírá AI kód? Zdroj: HUMAN_AI_INTERACTION_RESEARCH.md -- pokles přesnosti
            79,7 % → 19,8 % u méně zkušených radiologů se špatnou AI radou je ve zdroji potvrzen
            doslovně. ⚠️ Detail "27 radiologů, mamografy" ve zdroji není -- na živo neuvádět přesné číslo
            vzorku ani modalitu, dokud si to sami neověříte v primární studii. Plná bibliografická citace
            (časopis Radiology, přesné číslo) není v žádném z poskytnutých seznamů -- doplnit před
            uvedením do slidu se zdroji.
          </Notes>
        </Slide>

        {/* 12-4b. Pár 4/5 -- lék: hlídej si poměr rozhodnutí */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="primary" textAlign="center" fontSize="2.2rem">
              Hlídej si, kolik rozhodnutí je ještě tvých.
            </Heading>
            <Text color="quaternary" textAlign="center" width="75%" margin="24px 0 0" fontSize="1.2rem">
              Není to o AI. Je to o tom, kolik z tebe v té práci ještě zbývá.
            </Text>
            <Text color="quaternary" textAlign="center" margin="32px 0 0" fontSize="0.85rem" style={{ opacity: 0.7 }}>
              (inspirováno Kosmyna a kol., 2025)
            </Text>
          </FlexBox>
          <Notes>
            Hlídejte si poměr vlastních a "outsourcovaných" rozhodnutí. Osobní ukazatel cognitive debt.
            Poznámka: samotný koncept cognitive debt je ve zdroji (viz další slide, Kosmyna a kol.,
            2025), ale "poměr rozhodnutí" jako konkrétní metrika je vlastní praktický překlad, ne
            citovaný rámec -- na živo neuvádět jako název studie nebo modelu, jen jako "praktický
            ukazatel, který si z toho výzkumu beru".
          </Notes>
        </Slide>

        {/* 12-5a. Pár 5/5 -- problém: cognitive debt */}
        <Slide backgroundColor="quinary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="primary" textAlign="center" fontSize="2.2rem">
              Co nepoužíváš, to ztrácíš.
            </Heading>
            <Text color="quaternary" textAlign="center" width="75%" margin="24px 0 0" fontSize="1.2rem">
              "Cognitive debt": dovednost, kterou dnes přenecháš AI, jednou prostě nebude po ruce.
            </Text>
            <Text color="quaternary" textAlign="center" margin="32px 0 0" fontSize="0.85rem" style={{ opacity: 0.7 }}>
              (Kosmyna a kol., 2025)
            </Text>
          </FlexBox>
          <Notes>
            Intenzivní spoléhání na AI souvisí s nižší psychickou pohodou; paralela -- menší offline síť
            koreluje s AI jako společností (podobný motiv jako sociální únava CEO-expata v bloku 3).
            Bonus: delší/detailnější AI odpověď působí důvěryhodněji bez ohledu na přesnost (completeness
            bias) -- přesně tak vznikají halucinace, kterým věříme. Zdroj: HUMAN_AI_INTERACTION_RESEARCH.md,
            sekce 4 -- cognitive debt, beta = -0,38 (nižší psychická pohoda) a beta = -0,03 (AI jako
            společnost, velmi malý efekt) jsou ve zdroji potvrzené korelace. ⚠️ Jde o korelaci, ne
            prokázanou kauzalitu -- klidně to může fungovat i obráceně (lidé s nižší pohodou sahají po AI
            víc). Konkrétní zdroj termínu "cognitive debt" a EEG dat: Kosmyna, N., Hauptmann, E., Yuan, Y.
            T., Situ, J., Liao, X., Beresnitzky, A. V., Braunstein, I., &amp; Maes, P. (2025). Your Brain
            on ChatGPT: Accumulation of Cognitive Debt when Using an AI Assistant for Essay Writing Task.
            arXiv:2506.08872. Je to arXiv preprint (zatím ne recenzovaný časopisecky) -- na živo se dá
            říct "výzkumný tým z MIT Media Lab", ale je fér dodat, že jde o preprint.
          </Notes>
        </Slide>

        {/* 12-5b. Pár 5/5 -- lék: rozlište úkoly podle rizika */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="primary" textAlign="center" fontSize="2.2rem">
              Ne všechno si zaslouží stejnou pozornost.
            </Heading>
            <Text color="quaternary" textAlign="center" width="75%" margin="24px 0 0" fontSize="1.2rem">
              Mechanické věci klidně automatizuj naplno. Rizikové a nejednoznačné si nech pro sebe.
            </Text>
            <Text color="quaternary" textAlign="center" margin="32px 0 0" fontSize="0.85rem" style={{ opacity: 0.7 }}>
              (Ferdman, 2026; Rossi a kol., 2026)
            </Text>
          </FlexBox>
          <Notes>
            Rozlište úkoly podle rizika. Mechanické úkoly automatizovat směle, nejednoznačné/rizikové
            řídit vědomě sám. Doplňkový rámec, který lze na živo pojmenovat: "3R princip" (Rossi, S.,
            Fraccaro, V., &amp; Manzotti, R., 2026, npj Artificial Intelligence) -- výsledky (Results) lze
            delegovat na AI, ale odezvy (Responses) a odpovědnost (Responsibility) za směřování a smysl
            zůstávají na člověku. To je přesně rozdíl mezi "mechanickým" a "rizikovým" úkolem z tohoto
            slidu. Uzavírací myšlenka za celý blok 2, teď už podložená citací, ne jen rétorickým rámcem:
            Ferdman, A. (2026). AI deskilling is a structural problem. AI &amp; SOCIETY, 41, 3001-3013 --
            de-skilling není jen selhání jednotlivce, ale strukturální důsledek prostředí (defaultní
            nastavení, UX navržený pro rychlý souhlas, tlak na výkon). Bezpečná věta na živo: "Není to
            jen o vaší hlavě -- podle nedávné práce (Ferdman, 2026) je to i o tom, jak je to prostředí
            navržené."
          </Notes>
        </Slide>

        {/* 22. Block 2 -- exercise */}
        <Slide backgroundColor="tertiary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Text color="secondary" fontSize="1rem" margin="0 0 8px">
              45 sekund
            </Text>
            <Heading color="secondary" fontSize="2rem" textAlign="center">
              Kdy jste naposledy přijali AI návrh bez ověření?
              <br />Co by se stalo, kdyby byl špatně?
            </Heading>
          </FlexBox>
          <Notes>
            Most dál: cognitive debt / odbourávání dovedností je přímý most k tomu, proč záleží na tom,
            kdo jste a v čem jste dobří -- a tím se dostáváme k příběhům z praxe.
          </Notes>
        </Slide>

        {/* 23. Section 3 -- title */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <SectionBadge index={3} />
            <Heading color="primary" textAlign="center">
              Dvě kariéry, dva odlišné problémy
            </Heading>
            <Text color="tertiary" margin="24px 0 0">
              Metoda: NeuroLeadership (David Rock)
            </Text>
          </FlexBox>
          <Notes>
            Poznámka k důvěrnosti: případy jsou zobecněné a anonymizované. Poznámka k metodě: koučovací
            přístup vychází ze školy NeuroLeadership (David Rock), která staví na recenzovaném
            neurovědním výzkumu (např. SCARF model). Případové studie ukazují aplikaci té metody v
            praxi -- nejsou samy o sobě jejím vědeckým důkazem. Cíl bloku je ukázat, jak metoda funguje
            na živých lidech, ne dokazovat metodu samotnou.
          </Notes>
        </Slide>

        {/* 24. Case study 1 */}
        <Slide backgroundColor="secondary">
          <Heading color="primary">Absolvent</Heading>
          <Text color="quaternary" margin="0 0 16px">
            Diplomka, cestování, zajímavá práce -- a spousta rozptýlení mezi nimi.
          </Text>
          <Quote
            color="tertiary"
            fontSize="1.3rem"
            style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'normal', fontWeight: 500 }}
          >
            Cíl na hranici možného -- a pořád ještě nesmírně zajímavého.
          </Quote>
          <Notes>
            Klient dokončoval magisterskou práci, současně pracoval a snažil se rozhodnout, co dál.
            Chtěl cestovat a později působit v zahraničí, ale konkrétní kroky odkládal. ⚡ Hrana: cíle
            jsme museli postavit zároveň reálně a zajímavě -- o krok blíž k "zajímavému" už je
            fantasmagorie, o krok blíž k "bezpečnému" už je nuda. Společně jsme hledali souvislosti mezi
            studiem, kariérou, cestováním a osobním rozvojem a převedli obecná přání do konkrétních
            kroků. Klient strávil rok v zahraničí, úspěšně dokončil diplomovou práci a později se
            přestěhoval do Londýna, kde zahájil zajímavou mezinárodní kariéru.
          </Notes>
        </Slide>

        {/* 25. Case study 2 */}
        <Slide backgroundColor="quinary">
          <Heading color="primary">CEO technologického startupu</Heading>
          <Text color="quaternary" margin="0 0 16px">
            Expat, sociální únava, chtěl udržet energii pro rodinu i firmu.
          </Text>
          <Quote
            color="tertiary"
            fontSize="1.3rem"
            style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'normal', fontWeight: 500 }}
          >
            Ne firma, nebo rodina -- ale jak vést firmu jinak, aby zbylo na rodinu.
          </Quote>
          <Notes>
            Neřešil nedostatek výkonu, ale udržitelnost svého způsobu fungování. Nesl vysokou
            odpovědnost, žil jako expat bez velké komunity. ⚡ Hrana: logika něco za něco je past --
            ambice ve firmě přestala jít na účet rodiny, protože obě čerpaly ze stejného zdroje energie,
            který šlo řídit jako celek. Překvapivé zjištění: fungovaly malé, bezpečné kroky (např.
            pravidelná lekce jógy), ne radikální řezy -- fungovalo to i díky několikaměsíční prioritě.
            Krátká vsuvka ke kredibilitě: koučink není terapie ani mentoring. Terapie zkoumá vnitřek,
            mentoring dodává vnějšek "jak se to má dělat". Koučink je samostatný meziprostor -- pomáhá
            najít vlastní cestu bez hotové odpovědi. ⚡ Hrana: to je "pro-hoc" přístup (vlastní úsudek
            před informací zvenčí), chrání před ukotvením a udržuje schopnost jednat -- ale koučink sám
            o sobě nenahradí hlubokou psychologickou práci ani chybějící odbornou znalost, není
            samospasitelný. Otázka pro účastníky: Potřebuji dnes především najít nový směr, nebo změnit
            způsob, jakým nesu svou současnou odpovědnost?
          </Notes>
        </Slide>

        {/* 26. Section 4 -- title */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <SectionBadge index={4} />
            <Heading color="primary" textAlign="center">
              Jak řídit svou kariéru v době AI
            </Heading>
            <Text color="tertiary" margin="24px 0 0">
              Zamiř / Zvaž / Zaber
            </Text>
            <Text color="quaternary" margin="8px 0 0">
              Tenhle blok je aktivní, ne poslechový -- tužku a papír.
            </Text>
          </FlexBox>
          <Notes>
            Velký cíl (Londýn, udržitelné vedení firmy) i malý první krok (lekce jógy) fungovaly
            současně -- přesně tenhle vzorec teď rozpracujeme do postupu, který si každý účastník udělá
            sám pro sebe.
          </Notes>
        </Slide>

        {/* 27. Zamiř jasně */}
        <Slide backgroundColor="secondary">
          <Heading color="primary">Zamiř jasně</Heading>
          <OrderedList color="primary">
            <ListItem>60 s -- 5 věcí, které mě profesně opravdu baví</ListItem>
            <ListItem>60 s -- v čem mám velké, uznávané úspěchy</ListItem>
            <ListItem>60 s -- kde se oba seznamy potkávají?</ListItem>
          </OrderedList>
          <Notes>
            Krok 1: nemusí to být nejlépe placená práce, jde o to, co fakt těší -- co nejkonkrétnější.
            Krok 2: odlište věci zvládnuté jen pílí ("vypotil jsem tu prezentaci, není na medaili") od
            věcí, ve kterých jste fakt dobří. Krok 3: ⚡ Hrana -- identita nevzniká volbou jednoho
            seznamu, vzniká na průsečíku obou. To je základ profesní identity odolný vůči tlaku trhu i
            vůči cognitive debt z bloku 2 -- přesně ta část vás, kterou AI nenahradí.
          </Notes>
        </Slide>

        {/* 28. Zvaž věcně */}
        <Slide backgroundColor="quinary">
          <Heading color="primary">Zvaž věcně: 5× výtlak za 2 roky</Heading>
          <OrderedList color="primary">
            <ListItem>Co musí být pravda, aby se to stalo?</ListItem>
            <ListItem>Jaké lidi a kontakty potřebuju?</ListItem>
            <ListItem>Jaké lidské dovednosti se musím naučit?</ListItem>
            <ListItem>Jaký software by mi pomohl posunout se dál?</ListItem>
          </OrderedList>
          <Notes>
            Přesné číslo je vedlejší -- jde o myšlenkový úvazek. Proč to potřebuje režii: analytická
            mysl v IT při zadání "5× výtlak" okamžitě spadne do exekuce (závislosti, rizika,
            architektura) -- 30 s na to nestačí, mozek zahlásí Time Out a člověk zamrzne. Úkolem není
            plán vymyslet, ale nahodit první hrubý obrys. Rámování (říct doslova před spuštěním
            stopek): "Malý crash test, čtyři otázky, na každou přesně 30 vteřin. Zakazuji vám stavět
            architekturu řešení. Hledáme první instinktivní odpověď, klidně nesmysl, klidně jen pocit v
            břiše." 30 s na otázku, v 15. s vsuvka, pokud publikum zamrzne: (1) "Co by se muselo
            zlomit, abyste to vůbec mohli zkusit?" (2) "Jakou roli, kompetenci vám teď nikdo nekryje?"
            (3) "Čím tu hodnotu protlačíte dál, když kód a text píše stroj?" (4) "Co by ten systém dělal
            za vás, abyste vy mohli dělat ten 5× výtlak?" Záchranná brzda po cvičení: "Pokud jste to
            nestihli, je to v pořádku -- smyslem bylo donutit mozek podívat se za roh." ⚡ Hrana: velká
            vize dává směr, ale první krok zůstává úmyslně malý -- přesně jako lekce jógy u CEO.
          </Notes>
        </Slide>

        {/* 29. Zaber mocně */}
        <Slide backgroundColor="secondary">
          <Heading color="primary">Zaber mocně</Heading>
          <UnorderedList color="primary">
            <ListItem>Plán akorát velký pro mozek -- ne nulový, ne do detailu</ListItem>
            <ListItem>Osobní značka: metafora Volva</ListItem>
            <ListItem>90 s -- první krok do 7 dnů + parťák</ListItem>
          </UnorderedList>
          <Notes>
            ⚡ Hrana (plán): ani žádný plán (proplouváte bez cíle), ani plán do detailu (Excel, JIRA na
            osobní život). Co dál patří do průběžného plánu: budování sítě kontaktů, monitoring trhu
            práce a trendů v oboru. ⚡ Hrana (značka): jasná značka = okolí přesně ví, na jaké zadání
            vás napasovat -- i Volvo tahající valník s hnojem je pořád vnímáno jako bezpečné auto. Čím
            užší a konkrétnější značka ("LEGO kostička s konkrétními zoubky"), tím paradoxně větší
            adaptabilita na trhu. Závěrečné cvičení (90 s): Jaký je můj první krok do 7 dnů? Koho z
            okolí oslovím, abych to s ním probral -- někoho, kdo mi řekne "jdi do toho"?
          </Notes>
        </Slide>

        {/* 30. Section 5 -- title */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <SectionBadge index={5} />
            <Heading color="primary" textAlign="center">
              Závěr: používat nejen AI, ale také sebe
            </Heading>
            <Text color="quaternary" textAlign="center" width="70%" margin="24px 0 0">
              Často lze najít uspořádání, ve kterém se jednotlivé oblasti navzájem podporují.
            </Text>
          </FlexBox>
          <Notes>
            Kariérní rozhodování nemusí být pouze volbou "práce, nebo rodina", "výkon, nebo zdraví" či
            "jistota, nebo dobrodružství" -- most k pojmenování Hrany na příští slide.
          </Notes>
        </Slide>

        {/* 31. Jedna hrana -- recap */}
        <Slide backgroundColor="quinary">
          <Heading color="primary">Jedna hrana, která se táhla celým webinářem</Heading>
          <FlexBox flexWrap="wrap" justifyContent="center" margin="24px 0 0">
            {HRANA_PAIRS.map(([label, pair]) => (
              <Box
                key={label}
                margin="6px"
                padding="12px 18px"
                backgroundColor="secondary"
                style={{ borderRadius: 2, border: '1px solid rgba(239, 231, 217, 0.12)' }}
              >
                <Text color="tertiary" margin={0} fontWeight={700} fontSize="0.9rem">
                  {label}
                </Text>
                <Text color="primary" margin={0} fontSize="0.85rem">
                  {pair}
                </Text>
              </Box>
            ))}
          </FlexBox>
          <Notes>
            Nejde o kompromis mezi dvěma póly, ale o přesnou hranu, kde se posilují. Logika něco za něco
            (buď rodina, nebo práce / buď výkon, nebo zdraví / buď jistota, nebo dobrodružství) je past
            -- ptejte se "jak obojí", ne "kterou stranu obětovat". Zapamatujte si tenhle tvar -- příště,
            až budete řešit cokoliv rozporuplného v kariéře, zkuste místo volby jedné strany hledat tuhle
            hranu. V době AI nebude rozhodující jen kdo umí používat nejnovější nástroje, ale kdo
            dokáže řídit svou pozornost, energii, rozhodování a směřování -- a kdo si udrží vlastní
            úsudek místo toho, aby ho nenápadně outsourcoval.
          </Notes>
        </Slide>

        {/* 32. Odlehčená tečka */}
        <Slide backgroundColor="tertiary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="secondary" textAlign="center">
              Vymyslete si vtipný profesní název
            </Heading>
            <Text color="secondary" fontSize="1.1rem" margin="16px 0 0">
              "Kladivo na halucinace" · "Kulomet nápadů"
            </Text>
            <Text color="secondary" margin="24px 0 0">
              Napište ho do chatu
            </Text>
          </FlexBox>
          <Notes>
            Ať zapadne do vaší vášně a silné stránky. Ať vidíme, kdo se sešel.
          </Notes>
        </Slide>

        {/* 33. Thank you / Q&A */}
        <Slide backgroundColor="secondary">
          <FlexBox height="100%" flexDirection="column" alignItems="center" justifyContent="center">
            <Heading color="primary">Děkuji</Heading>
            <Text color="quaternary" margin="16px 0 0">
              Otázky?
            </Text>
          </FlexBox>
          <Notes>
            Pokud padnou tvrdší otázky (např. od neurovědce v publiku), viz "Příprava na Q&amp;A" v
            REFINED_OUTLINE.md -- odpovědi na námitky k neurovědě, číslům bez kontextu, zastaralým
            rámcům, kauzalitě vs. korelaci, anekdotám a k motivu Hrany samotnému. Backup slide "Zdroje" s
            plnými referencemi je hned za touto -- otevřít jen pokud se na zdroje někdo zeptá.
          </Notes>
        </Slide>

        {/* 34. Zdroje -- backup slide pro Q&A */}
        <Slide backgroundColor="primary">
          <Heading color="secondary" fontSize="1.6rem">Zdroje</Heading>
          <Text color="quaternary" fontSize="0.8rem" margin="0 0 16px">
            Akademické reference k poznatkům a doporučením z bloku 2. Dvě položky (Dratsch a kol.,
            Cabitza a kol.) je potřeba doplnit o přesnou bibliografickou citaci před veřejným publikováním
            -- viz poznámka u každé.
          </Text>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text color="secondary" fontSize="0.72rem" margin={0} style={{ lineHeight: 1.4 }}>
              Romeo, G., &amp; Conti, D. (2026). Exploring automation bias in human-AI collaboration: a
              review and implications for explainable AI. <i>AI &amp; SOCIETY</i>, 41, 259-278.
              https://doi.org/10.1007/s00146-025-02422-7
            </Text>
            <Text color="secondary" fontSize="0.72rem" margin={0} style={{ lineHeight: 1.4 }}>
              Kim, T. W., Usman, U., Garvey, A., &amp; Duhachek, A. (2026). From algorithm aversion to AI
              dependence: Deskilling, upskilling, and emerging addictions in the GenAI age. <i>Consumer
              Psychology Review</i>, 9(1), 142-164. https://doi.org/10.1002/arcp.70008
            </Text>
            <Text color="secondary" fontSize="0.72rem" margin={0} style={{ lineHeight: 1.4 }}>
              Kosmyna, N., Hauptmann, E., Yuan, Y. T., Situ, J., Liao, X., Beresnitzky, A. V., Braunstein,
              I., &amp; Maes, P. (2025). Your Brain on ChatGPT: Accumulation of Cognitive Debt when Using
              an AI Assistant for Essay Writing Task. <i>arXiv preprint</i> arXiv:2506.08872.
            </Text>
            <Text color="secondary" fontSize="0.72rem" margin={0} style={{ lineHeight: 1.4 }}>
              Rossi, S., Fraccaro, V., &amp; Manzotti, R. (2026). The brain side of human-AI interactions
              in the long-term: the "3R principle". <i>npj Artificial Intelligence</i>, 2, 15.
              https://doi.org/10.1038/s44387-025-00063-1
            </Text>
            <Text color="secondary" fontSize="0.72rem" margin={0} style={{ lineHeight: 1.4 }}>
              Ferdman, A. (2026). AI deskilling is a structural problem. <i>AI &amp; SOCIETY</i>, 41,
              3001-3013. https://doi.org/10.1007/s00146-025-02686-z
            </Text>
            <Text color="tertiary" fontSize="0.72rem" margin={0} style={{ lineHeight: 1.4 }}>
              ⚠️ Dratsch a kol. (2023) -- radiologové, pokles přesnosti 79,7 % → 19,8 %. Přesná citace
              (časopis, číslo) není v žádném poskytnutém seznamu zdrojů -- doplnit před veřejným použitím.
            </Text>
            <Text color="tertiary" fontSize="0.72rem" margin={0} style={{ lineHeight: 1.4 }}>
              ⚠️ Cabitza a kol. (2024) -- model "Pro-hoc" a Cognitive Forcing Functions. Přesná citace
              není v žádném poskytnutém seznamu zdrojů -- doplnit před veřejným použitím.
            </Text>
          </Box>
          <Notes>
            Backup slide pro Q&amp;A -- neukazovat aktivně, jen na dotaz "kde to máte podložené?". Dvě
            položky (Dratsch, Cabitza) čerpají jen z interního HUMAN_AI_INTERACTION_RESEARCH.md a nemají
            zatím ověřenou plnou bibliografickou citaci -- než se tenhle slide sdílí veřejně (např. jako
            PDF po webináři), oba záznamy dohledat a doplnit.
          </Notes>
        </Slide>
      </Deck>
    </div>
  );
}
