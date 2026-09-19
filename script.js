/* ============================================================
   Bente - Rechnen üben in der Grundschule

   Aufbau:
     1. Navigation und Vorlesen
     2. Kleine Helfer (Zufall)
     3. DAS THEMEN-REGISTER  - hier stehen alle Inhalte
     4. Auswahl: Reihen und Übungsart
     5. Die Übungsrunde
     6. Lerncoach
     7. Ergebnis

   Ein neues Thema braucht nur einen Eintrag in "themen" (Teil 3)
   und seine Gruppe im Startbildschirm.
   ============================================================ */


/* ============================================
   1. Navigation und Vorlesen
   ============================================ */

function showScreen(screenId) {
    /* Timer stoppen, sonst laeuft die Uhr einer verlassenen Runde
       weiter und beendet spaeter ein Spiel, das niemand mehr spielt. */
    if (spiel.timerInterval) { clearInterval(spiel.timerInterval); spiel.timerInterval = null; }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const ziel = document.getElementById(screenId);
    if (ziel) ziel.classList.add('active');
}

function kannVorlesen() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function deutscheStimme() {
    const stimmen = window.speechSynthesis.getVoices();
    return stimmen.find(s => s.lang && s.lang.toLowerCase().startsWith('de')) || null;
}

/* Rechenzeichen ausschreiben - sonst liest die Stimme "7 · 8" als
   "sieben acht" vor. */
function sprechbar(text) {
    return String(text)
        .replace(/\+/g, ' plus ')
        .replace(/[−-]/g, ' minus ')
        .replace(/[·×*]/g, ' mal ')
        .replace(/[:÷]/g, ' geteilt durch ')
        .replace(/=/g, ' ist gleich ')
        .replace(/\s+/g, ' ')
        .trim();
}

function lesVor(text) {
    if (!kannVorlesen() || !text) return;
    window.speechSynthesis.cancel();
    const spruch = new SpeechSynthesisUtterance(sprechbar(text));
    const stimme = deutscheStimme();
    if (stimme) spruch.voice = stimme;
    spruch.lang = 'de-DE';
    spruch.rate = 0.9;
    window.speechSynthesis.speak(spruch);
}

function lesVorAusElement(element) {
    if (!element) return;
    const kopie = element.cloneNode(true);
    kopie.querySelectorAll('button').forEach(b => b.remove());
    lesVor(kopie.innerText);
}


/* ============================================
   2. Kleine Helfer
   ============================================ */

function z(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function waehle(liste) { return liste[Math.floor(Math.random() * liste.length)]; }


/* ============================================================
   3. DAS THEMEN-REGISTER

   Jeder Eintrag ist eine Kachel und eine Übungsart.

     titel, emoji, hint  - was auf der Kachel steht
     gruppe              - in welchen Block des Startbildschirms
     farbe               - CSS-Klasse für die Kachelfarbe
     reihen              - Bereich der wählbaren Reihen, sonst null
     aufgabe(reihen)     - erzeugt EINE Aufgabe:
                           { frage?, text?, antwort, rest?, rechnung?, hinweis }
                           frage    = die Rechnung; fehlt sie, bleibt die
                                      Zeile leer (Sachaufgaben)
                           text     = Sachaufgabe zum Lesen
                           rest     = zweites Eingabefeld erscheint
                           rechnung = Lösungsweg, erst bei der Auflösung
     coach(aufgabe)      - Schritte des Lerncoaches, sonst nicht gesetzt
   ============================================================ */

/* Die Schritte des Lerncoaches sind bei allen Aufgaben mit
   Zehneruebergang dieselben - ob einstellig oder zweistellig
   dazukommt, aendert am Weg nichts. Darum stehen sie hier einmal
   und werden von vier Themen benutzt. */
function coachPlusUebergang(aufgabe) {
    const [a, b] = aufgabe.frage.split(' + ').map(Number);
    const bis = 10 - (a % 10);
    return [
        { frage: `Wie viele fehlen von ${a} bis zum nächsten vollen Zehner?`, antwort: `Es fehlen ${bis}. Dann bist du bei ${a + bis}.`, notiz: `${a} + ${bis} = ${a + bis}` },
        { frage: `Teile die ${b} auf: ${bis} und wie viel bleibt übrig?`, antwort: `${bis} und ${b - bis}.`, notiz: `${bis} + ${b - bis} = ${b}` },
        { frage: `Jetzt rechne ${a + bis} + ${b - bis}.`, antwort: `Das sind ${a + b}.`, notiz: `${a + bis} + ${b - bis} = ${a + b}` }
    ];
}

function coachMinusUebergang(aufgabe) {
    const [a, b] = aufgabe.frage.split(' − ').map(Number);
    const zurueck = a % 10;
    return [
        { frage: `Wie weit ist es von ${a} zurück zum vollen Zehner?`, antwort: `${zurueck} zurück, dann stehst du auf ${a - zurueck}.`, notiz: `${a} - ${zurueck} = ${a - zurueck}` },
        { frage: `Teile die ${b} auf: ${zurueck} und wie viel bleibt übrig?`, antwort: `${zurueck} und ${b - zurueck}.`, notiz: `${zurueck} + ${b - zurueck} = ${b}` },
        { frage: `Jetzt rechne ${a - zurueck} − ${b - zurueck}.`, antwort: `Das sind ${a - b}.`, notiz: `${a - zurueck} - ${b - zurueck} = ${a - b}` }
    ];
}

const themen = {

    /* ---------- Malnehmen und Teilen ---------- */

    einmaleins: {
        titel: '1×1 üben', emoji: '✖️', hint: 'Das kleine Einmaleins',
        gruppe: 'gruppeMalGeteilt', farbe: 'farbe-mal',
        reihen: { von: 1, bis: 10, wort: 'Malreihen' },
        aufgabe: reihen => {
            const a = waehle(reihen);
            const b = z(1, 10);
            return {
                frage: `${a} · ${b}`,
                antwort: a * b,
                hinweis: `Zähle in ${a}er-Schritten: ${a}, ${a * 2}, ${a * 3} …`
            };
        }
    },

    geteilt: {
        titel: '1:1 üben', emoji: '➗', hint: 'Teilen ohne Rest',
        gruppe: 'gruppeMalGeteilt', farbe: 'farbe-geteilt',
        reihen: { von: 2, bis: 10, wort: 'Teilerreihen' },
        aufgabe: reihen => {
            const teiler = waehle(reihen);
            const ergebnis = z(1, 10);
            return {
                frage: `${teiler * ergebnis} : ${teiler}`,
                antwort: ergebnis,
                hinweis: `Frage dich: Wie oft passt die ${teiler} in die ${teiler * ergebnis}?`
            };
        }
    },

    geteiltRest: {
        titel: '1:1 mit Rest', emoji: '➗ ✚', hint: 'Etwas bleibt übrig',
        gruppe: 'gruppeMalGeteilt', farbe: 'farbe-rest',
        reihen: { von: 2, bis: 10, wort: 'Teilerreihen' },
        aufgabe: reihen => {
            const teiler = waehle(reihen);
            /* Die Zahl muss unter 100 bleiben - bei der 10er-Reihe
               waeren 10 · 10 + Rest sonst schon ueber dem Zahlenraum. */
            const maxErgebnis = Math.min(10, Math.floor((99 - (teiler - 1)) / teiler));
            const ergebnis = z(1, maxErgebnis);
            const rest = z(1, teiler - 1);
            const zahl = teiler * ergebnis + rest;
            return {
                frage: `${zahl} : ${teiler}`,
                antwort: ergebnis,
                rest: rest,
                hinweis: `Die größte Zahl der ${teiler}er-Reihe unter ${zahl} ist ${teiler * ergebnis}. Was bleibt dann übrig?`
            };
        }
    },

    /* ---------- Plus und Minus bis 20 ---------- */

    plus20: {
        titel: 'Plus bis 20', emoji: '➕ 🔟', hint: 'einstellig dazu, z. B. 8 + 5',
        gruppe: 'gruppePlusMinus20', farbe: 'farbe-plus-zwanzig',
        reihen: null,
        aufgabe: () => {
            /* Beide Zahlen einstellig und zusammen mehr als 10. Genau 10
               waere kein Uebergang, sondern nur das Ergaenzen zum Zehner -
               darum beginnt a erst bei 2 und b erst bei 11 - a. */
            const a = z(2, 9);
            const b = z(Math.max(2, 11 - a), 9);
            const bisZehn = 10 - a;
            return {
                frage: `${a} + ${b}`,
                antwort: a + b,
                hinweis: `Rechne erst bis zur 10: ${a} + ${bisZehn} = 10.`
            };
        },
        coach: coachPlusUebergang
    },

    minus20: {
        titel: 'Minus bis 20', emoji: '➖ 🔟', hint: 'einstellig weg, z. B. 15 − 7',
        gruppe: 'gruppePlusMinus20', farbe: 'farbe-minus-zwanzig',
        reihen: null,
        aufgabe: () => {
            /* Zwischen 11 und 18 minus einstellig, und der Einer oben ist
               kleiner als die Zahl, die weggeht - nur dann muss man unter
               die 10 zurueck. */
            const e1 = z(1, 8);
            const b = z(e1 + 1, 9);
            const a = 10 + e1;
            return {
                frage: `${a} − ${b}`,
                antwort: a - b,
                hinweis: `Rechne erst bis zur 10 zurück: ${a} − ${e1} = 10.`
            };
        },
        coach: coachMinusUebergang
    },

    /* ---------- Plus und Minus bis 100 ---------- */

    plus100: {
        titel: 'Plus bis 100', emoji: '➕', hint: 'ohne Zehnerübergang',
        gruppe: 'gruppePlusMinus', farbe: 'farbe-plus',
        reihen: null,
        aufgabe: () => {
            /* Ohne Übergang heißt: die Einer zusammen bleiben unter 10
               und die Zehner ebenso. */
            const e1 = z(0, 8);
            const e2 = z(1, 9 - e1);
            const zehner1 = z(1, 8);
            const zehner2 = z(1, 9 - zehner1);
            const a = zehner1 * 10 + e1;
            const b = zehner2 * 10 + e2;
            return {
                frage: `${a} + ${b}`,
                antwort: a + b,
                hinweis: `Erst die Zehner: ${zehner1 * 10} + ${zehner2 * 10} = ${(zehner1 + zehner2) * 10}. Dann die Einer dazu.`
            };
        }
    },

    minus100: {
        titel: 'Minus bis 100', emoji: '➖', hint: 'ohne Zehnerübergang',
        gruppe: 'gruppePlusMinus', farbe: 'farbe-minus',
        reihen: null,
        aufgabe: () => {
            const zehner1 = z(2, 9);
            const e1 = z(1, 9);
            const zehner2 = z(1, zehner1 - 1);
            const e2 = z(0, e1);
            const a = zehner1 * 10 + e1;
            const b = zehner2 * 10 + e2;
            return {
                frage: `${a} − ${b}`,
                antwort: a - b,
                hinweis: `Erst die Zehner: ${zehner1 * 10} − ${zehner2 * 10} = ${(zehner1 - zehner2) * 10}. Dann die Einer abziehen.`
            };
        }
    },

    plusZueEiner: {
        titel: 'Plus über den Zehner', emoji: '➕ ↗', hint: 'einstellig dazu, z. B. 27 + 8',
        gruppe: 'gruppePlusMinus', farbe: 'farbe-plus-zue-eins',
        reihen: null,
        aufgabe: () => {
            /* Zweistellig + einstellig, und die Einer zusammen sind mehr
               als 10. Genau 10 waere kein Uebergang, sondern nur das
               Ergaenzen zum Zehner - darum beginnt e1 erst bei 2. */
            const e1 = z(2, 9);
            const b = z(11 - e1, 9);
            const a = z(1, 8) * 10 + e1;
            const bisZehner = 10 - e1;
            return {
                frage: `${a} + ${b}`,
                antwort: a + b,
                hinweis: `Rechne erst bis zum vollen Zehner: ${a} + ${bisZehner} = ${a + bisZehner}.`
            };
        },
        coach: coachPlusUebergang
    },

    minusZueEiner: {
        titel: 'Minus über den Zehner', emoji: '➖ ↘', hint: 'einstellig weg, z. B. 62 − 7',
        gruppe: 'gruppePlusMinus', farbe: 'farbe-minus-zue-eins',
        reihen: null,
        aufgabe: () => {
            /* Zweistellig − einstellig, und der Einer oben ist kleiner
               als die Zahl, die weggeht - nur dann muss man ueber den
               Zehner zurueck. */
            const e1 = z(1, 8);
            const b = z(e1 + 1, 9);
            const a = z(1, 9) * 10 + e1;
            return {
                frage: `${a} − ${b}`,
                antwort: a - b,
                hinweis: `Rechne erst bis zum vollen Zehner zurück: ${a} − ${e1} = ${a - e1}.`
            };
        },
        coach: coachMinusUebergang
    },

    plusZue: {
        titel: 'Plus mit Übergang', emoji: '➕ ↗', hint: 'zweistellig dazu, z. B. 27 + 38',
        gruppe: 'gruppePlusMinus', farbe: 'farbe-plus-zue',
        reihen: null,
        aufgabe: () => {
            /* Mit Übergang heißt: die Einer zusammen sind mindestens 10. */
            const e1 = z(1, 9);
            const e2 = z(10 - e1, 9);
            const zehner1 = z(1, 7);
            const zehner2 = z(0, 8 - zehner1);
            const a = zehner1 * 10 + e1;
            const b = zehner2 * 10 + e2;
            const bisZehner = 10 - e1;
            return {
                frage: `${a} + ${b}`,
                antwort: a + b,
                hinweis: `Rechne erst bis zum vollen Zehner: ${a} + ${bisZehner} = ${a + bisZehner}.`
            };
        },
        coach: coachPlusUebergang
    },

    minusZue: {
        titel: 'Minus mit Übergang', emoji: '➖ ↘', hint: 'zweistellig weg, z. B. 62 − 37',
        gruppe: 'gruppePlusMinus', farbe: 'farbe-minus-zue',
        reihen: null,
        aufgabe: () => {
            /* Mit Übergang heißt: der Einer oben ist kleiner als unten. */
            const e1 = z(1, 8);
            const e2 = z(e1 + 1, 9);
            const zehner1 = z(2, 9);
            const zehner2 = z(1, zehner1 - 1);
            const a = zehner1 * 10 + e1;
            const b = zehner2 * 10 + e2;
            return {
                frage: `${a} − ${b}`,
                antwort: a - b,
                hinweis: `Rechne erst bis zum vollen Zehner zurück: ${a} − ${e1} = ${a - e1}.`
            };
        },
        coach: coachMinusUebergang
    },

    /* ---------- Knobeln ---------- */

    sachaufgaben: {
        titel: 'Sachaufgaben', emoji: '📖', hint: 'auch mit Rest',
        gruppe: 'gruppeKnobeln', farbe: 'farbe-sach',
        reihen: null,
        aufgabe: () => waehle(sachaufgabenVorlagen)()
    },

    punktVorStrich: {
        titel: 'Punkt vor Strich', emoji: '✖️ ➕', hint: 'Reihenfolge beachten',
        gruppe: 'gruppeKnobeln', farbe: 'farbe-punkt',
        reihen: null,
        aufgabe: () => {
            for (let i = 0; i < 100; i++) {
                const a = z(2, 9);
                const b = z(2, 9);
                const produkt = a * b;
                const form = z(1, 4);
                const c = z(1, 9);

                if (form === 1) {
                    return { frage: `${a} · ${b} + ${c}`, antwort: produkt + c, hinweis: `Punkt vor Strich: zuerst ${a} · ${b} = ${produkt}.` };
                }
                if (form === 2 && produkt > c) {
                    return { frage: `${a} · ${b} − ${c}`, antwort: produkt - c, hinweis: `Punkt vor Strich: zuerst ${a} · ${b} = ${produkt}.` };
                }
                if (form === 3) {
                    return { frage: `${c} + ${a} · ${b}`, antwort: c + produkt, hinweis: `Punkt vor Strich: zuerst ${a} · ${b} = ${produkt}, auch wenn es hinten steht.` };
                }
                /* Bei "c − a · b" muss das Produkt kleiner sein als c,
                   sonst wäre das Ergebnis negativ. Außerdem darf c nur
                   einstellig sein. */
                if (form === 4 && c > produkt) {
                    return { frage: `${c} − ${a} · ${b}`, antwort: c - produkt, hinweis: `Punkt vor Strich: zuerst ${a} · ${b} = ${produkt}, dann von ${c} abziehen.` };
                }
            }

            /* Fallback: immer gültig und nur mit einstelligen Zusatzzahlen. */
            const a = 2;
            const b = 2;
            const produkt = 4;
            const c = 3;
            return { frage: `${a} · ${b} + ${c}`, antwort: produkt + c, hinweis: `Punkt vor Strich: zuerst ${a} · ${b} = ${produkt}.` };
        }
    }
};

/* Die Sachaufgaben. Jede Vorlage würfelt ihre eigenen Zahlen, damit
   sie nicht beim zweiten Mal gleich aussieht. Aufgaben mit Rest
   liefern zusätzlich "rest" - dann erscheint das zweite Feld.

   Hier steht absichtlich kein "frage": Die Kinder sollen die Rechnung
   selbst aus der Situation herauslesen. Sie steht nur in "rechnung"
   und wird erst gezeigt, wenn die Aufgabe aufgelöst wird. Plus und
   Minus bleiben deshalb bei zweistellig +/- einstellig - geübt wird
   das Übersetzen, nicht das Rechnen. */
const sachaufgabenVorlagen = [
    () => {
        const paeckchen = z(3, 9), proPaeckchen = z(4, 9);
        return {
            text: `Bente kauft ${paeckchen} Päckchen Sticker. In jedem Päckchen sind ${proPaeckchen} Sticker. Wie viele Sticker hat er?`,
            rechnung: `${paeckchen} · ${proPaeckchen}`,
            antwort: paeckchen * proPaeckchen,
            hinweis: `${paeckchen} Päckchen mit je ${proPaeckchen} Stickern: Das ist eine Malaufgabe.`
        };
    },
    () => {
        const kinder = z(3, 8), proKind = z(3, 9);
        return {
            text: `Bente verteilt ${kinder * proKind} Gummibärchen gerecht an ${kinder} Kinder. Wie viele bekommt jedes Kind?`,
            rechnung: `${kinder * proKind} : ${kinder}`,
            antwort: proKind,
            hinweis: `Gerecht verteilen heißt teilen: ${kinder * proKind} : ${kinder}.`
        };
    },
    () => {
        const proKette = z(4, 9), ketten = z(3, 8), rest = z(1, proKette - 1);
        const perlen = ketten * proKette + rest;
        return {
            text: `Bente hat ${perlen} Perlen. Für eine Kette braucht er ${proKette} Perlen. Wie viele Ketten werden fertig und wie viele Perlen bleiben übrig?`,
            rechnung: `${perlen} : ${proKette}`,
            antwort: ketten,
            rest: rest,
            hinweis: `Wie oft passt die ${proKette} in die ${perlen}? Was übrig bleibt, ist der Rest.`
        };
    },
    () => {
        const proTuete = z(4, 9), tueten = z(3, 8), rest = z(1, proTuete - 1);
        const kekse = tueten * proTuete + rest;
        return {
            text: `Bente backt ${kekse} Kekse und packt immer ${proTuete} Kekse in eine Tüte. Wie viele Tüten werden voll und wie viele Kekse bleiben übrig?`,
            rechnung: `${kekse} : ${proTuete}`,
            antwort: tueten,
            rest: rest,
            hinweis: `Teile ${kekse} durch ${proTuete}. Was nicht mehr reicht, bleibt übrig.`
        };
    },
    () => {
        const bente = z(21, 58), bruder = z(2, 9);
        return {
            text: `Bente sammelt ${bente} Kastanien, sein Bruder sammelt ${bruder}. Wie viele haben die beiden zusammen?`,
            rechnung: `${bente} + ${bruder}`,
            antwort: bente + bruder,
            hinweis: `"Zusammen" heißt: dazurechnen.`
        };
    },
    () => {
        const start = z(21, 98), ausgabe = z(2, 9);
        return {
            text: `Bente hat ${start} Cent im Portemonnaie und kauft ein Bonbon für ${ausgabe} Cent. Wie viel Geld bleibt ihm?`,
            rechnung: `${start} − ${ausgabe}`,
            antwort: start - ausgabe,
            hinweis: `Was übrig bleibt, rechnest du mit Minus aus.`
        };
    },
    () => {
        const baenke = z(3, 7), proBank = z(3, 8), extra = z(2, 9);
        return {
            text: `Auf dem Schulhof stehen ${baenke} Bänke. Auf jeder Bank sitzen ${proBank} Kinder. ${extra} Kinder stehen daneben. Wie viele Kinder sind das zusammen?`,
            rechnung: `${baenke} · ${proBank} + ${extra}`,
            antwort: baenke * proBank + extra,
            hinweis: `Punkt vor Strich: erst die Kinder auf den Bänken, dann die anderen dazu.`
        };
    },
    () => {
        const reihen = z(3, 9), proReihe = z(3, 9);
        return {
            text: `In Bentes Eierkarton liegen ${reihen} Reihen mit je ${proReihe} Eiern. Wie viele Eier sind es?`,
            rechnung: `${reihen} · ${proReihe}`,
            antwort: reihen * proReihe,
            hinweis: `Reihen mal Anzahl je Reihe.`
        };
    },
    () => {
        const seiten = z(4, 9), proSeite = z(4, 9);
        const gesamt = seiten * proSeite;
        /* Einstellig: der Fokus liegt auf dem Aufstellen der Rechnung,
           nicht auf dem Rechnen. Es passen immer mindestens 16 Bilder
           hinein, das Ergebnis wird also nie negativ. */
        const gelesen = z(2, 9);
        return {
            text: `Bentes Sammelalbum hat ${seiten} Seiten mit je ${proSeite} Bildern. ${gelesen} Bilder hat er schon eingeklebt. Wie viele fehlen noch?`,
            rechnung: `${seiten} · ${proSeite} − ${gelesen}`,
            antwort: gesamt - gelesen,
            hinweis: `Erst ausrechnen, wie viele Bilder hineinpassen: ${seiten} · ${proSeite} = ${gesamt}.`
        };
    },
    /* Aufrunden: 23 : 5 = 4 Rest 3, aber die letzten 3 Kinder brauchen
       noch eine Fahrt. Die Antwort ist darum eine mehr als der Quotient.
       Deshalb hat diese Vorlage auch keine "rechnung" - "23 : 5 = 5"
       waere falsch. Den Weg erklaert stattdessen der Hinweis. */
    () => {
        const proFahrt = z(4, 6), volleFahrten = z(3, 5), rest = z(1, proFahrt - 1);
        const kinder = volleFahrten * proFahrt + rest;
        return {
            text: `Der Fahrstuhl kann ${proFahrt} Kinder mitnehmen. In der Klasse 3b sind ${kinder} Kinder. Wie oft muss der Fahrstuhl fahren, damit alle nach oben kommen?`,
            antwort: volleFahrten + 1,
            hinweis: `${kinder} : ${proFahrt} = ${volleFahrten} Rest ${rest}. Für die letzten ${rest} Kinder muss der Fahrstuhl noch einmal fahren.`
        };
    },
    () => {
        const proBeutel = z(3, 8), beutel = z(4, 9), rest = z(1, proBeutel - 1);
        const murmeln = beutel * proBeutel + rest;
        return {
            text: `Bente hat ${murmeln} Murmeln. In einen Beutel passen ${proBeutel} Murmeln. Wie viele Beutel kann er füllen und wie viele Murmeln bleiben übrig?`,
            rechnung: `${murmeln} : ${proBeutel}`,
            antwort: beutel,
            rest: rest,
            hinweis: `Teile ${murmeln} durch ${proBeutel} und schau, was übrig bleibt.`
        };
    }
];

/* Reihenfolge der Kacheln je Gruppe. */
const gruppenReihenfolge = {
    gruppeMalGeteilt: ['einmaleins', 'geteilt', 'geteiltRest'],
    gruppePlusMinus20: ['plus20', 'minus20'],
    gruppePlusMinus: ['plus100', 'minus100', 'plusZueEiner', 'minusZueEiner', 'plusZue', 'minusZue'],
    gruppeKnobeln: ['sachaufgaben', 'punktVorStrich']
};

function initThemen() {
    Object.keys(gruppenReihenfolge).forEach(gruppeId => {
        const grid = document.getElementById(gruppeId);
        if (!grid) return;
        grid.innerHTML = gruppenReihenfolge[gruppeId].map(key => {
            const t = themen[key];
            return `<button class="operation-btn ${t.farbe}" onclick="openThema('${key}')">
                        <span class="emoji">${t.emoji}</span>
                        <span class="text">${t.titel}</span>
                        <span class="card-hint">${t.hint}</span>
                    </button>`;
        }).join('');
    });
}


/* ============================================================
   4. Auswahl: Reihen und Übungsart
   ============================================================ */

const DAUER_EINZELN = 300;    // 5 Minuten
const DAUER_GEMISCHT = 900;   // 15 Minuten
const DAUER_CHALLENGE = 1200; // 20 Minuten
const CHALLENGE_AUFGABEN = 100;

const spiel = {
    themaKey: null,
    thema: null,
    modus: 'einzeln',        // 'einzeln' | 'gemischt' | 'challenge'
    reihen: [],
    timed: true,
    timer: 0,
    dauer: 0,
    timerInterval: null,
    aufgabe: null,
    letzteFrage: null,
    versuche: 1,
    coachBenutzt: false,
    aktivesFeld: 'antwort',
    richtig: 0,
    gesamt: 0,
    mitCoach: 0,
    ziel: null               // Anzahl Aufgaben bei der Herausforderung
};

function openThema(key) {
    spiel.themaKey = key;
    spiel.thema = themen[key];
    spiel.modus = 'einzeln';
    spiel.ziel = null;

    if (spiel.thema.reihen) {
        const bereich = spiel.thema.reihen;
        /* Beim ersten Öffnen sind alle Reihen an - so kann man sofort
           losüben, ohne erst etwas auswählen zu müssen. */
        spiel.reihen = [];
        for (let r = bereich.von; r <= bereich.bis; r++) spiel.reihen.push(r);
        document.getElementById('reihenTitel').innerText = `Welche ${bereich.wort}?`;
        renderReihen();
        showScreen('reihenScreen');
    } else {
        oeffneModus();
    }
}

function renderReihen() {
    const bereich = spiel.thema.reihen;
    let html = '';
    for (let r = bereich.von; r <= bereich.bis; r++) {
        const an = spiel.reihen.includes(r);
        html += `<button class="reihen-btn${an ? ' an' : ''}" onclick="toggleReihe(${r})">${r}</button>`;
    }
    document.getElementById('reihenGrid').innerHTML = html;
    /* Ohne Reihe keine Aufgabe - dann darf es nicht weitergehen. */
    document.getElementById('reihenWeiter').disabled = spiel.reihen.length === 0;
}

function toggleReihe(r) {
    if (spiel.reihen.includes(r)) spiel.reihen = spiel.reihen.filter(x => x !== r);
    else spiel.reihen.push(r);
    renderReihen();
}

function alleReihen(an) {
    const bereich = spiel.thema.reihen;
    spiel.reihen = [];
    if (an) for (let r = bereich.von; r <= bereich.bis; r++) spiel.reihen.push(r);
    renderReihen();
}

function reihenWeiter() {
    if (spiel.reihen.length === 0) return;
    oeffneModus();
}

function oeffneModus() {
    document.getElementById('modusTitel').innerText = `${spiel.thema.titel}: Wie möchtest du üben?`;
    showScreen('modusScreen');
}

function zurueckVonModus() {
    if (spiel.thema && spiel.thema.reihen) showScreen('reihenScreen');
    else showScreen('startScreen');
}


/* ============================================================
   5. Die Übungsrunde
   ============================================================ */

function startEinzeln(timed) {
    spiel.modus = 'einzeln';
    spiel.timed = timed;
    spiel.dauer = DAUER_EINZELN;
    spiel.ziel = null;
    starteRunde(spiel.thema.titel);
}

function startGemischt() {
    spiel.modus = 'gemischt';
    spiel.themaKey = null;
    spiel.thema = null;
    spiel.timed = true;
    spiel.dauer = DAUER_GEMISCHT;
    spiel.ziel = null;
    starteRunde('Gemischt üben');
}

function startChallenge(key) {
    spiel.modus = 'challenge';
    spiel.themaKey = key;
    spiel.thema = themen[key];
    /* Die Herausforderung geht über alle Reihen - sie soll das ganze
       Einmaleins abfragen, nicht eine ausgesuchte Reihe. */
    const bereich = spiel.thema.reihen;
    spiel.reihen = [];
    for (let r = bereich.von; r <= bereich.bis; r++) spiel.reihen.push(r);
    spiel.timed = true;
    spiel.dauer = DAUER_CHALLENGE;
    spiel.ziel = CHALLENGE_AUFGABEN;
    starteRunde(`${spiel.thema.titel}: ${CHALLENGE_AUFGABEN} Aufgaben`);
}

function starteRunde(titel) {
    spiel.richtig = 0;
    spiel.gesamt = 0;
    spiel.mitCoach = 0;
    spiel.letzteFrage = null;
    spiel.timer = spiel.dauer;

    document.getElementById('spielTitel').innerText = titel;
    document.getElementById('spielTimer').hidden = !spiel.timed;
    document.getElementById('fertigBtn').hidden = spiel.timed;
    document.getElementById('spielHinweis').innerText = '';

    aktualisiereFortschritt();
    showScreen('spielScreen');
    naechsteAufgabe();

    if (spiel.timed) {
        aktualisiereTimer();
        spiel.timerInterval = setInterval(() => {
            spiel.timer--;
            aktualisiereTimer();
            if (spiel.timer <= 0) {
                clearInterval(spiel.timerInterval);
                spiel.timerInterval = null;
                endeRunde();
            }
        }, 1000);
    }
}

function aktualisiereTimer() {
    const min = Math.floor(spiel.timer / 60);
    const sek = String(spiel.timer % 60).padStart(2, '0');
    const anzeige = document.getElementById('spielTimer');
    anzeige.innerText = `⏰ ${min}:${sek}`;
    /* Die letzte halbe Minute wird rot - man soll merken, dass es
       knapp wird, ohne dauernd auf die Uhr zu schauen. */
    anzeige.classList.toggle('knapp', spiel.timer <= 30);
}

function aktualisiereFortschritt() {
    const box = document.getElementById('spielFortschritt');
    if (spiel.ziel) {
        box.innerHTML = `Aufgabe <span id="spielGesamt">${Math.min(spiel.gesamt + 1, spiel.ziel)}</span>/${spiel.ziel} · richtig: <span id="spielRichtig">${spiel.richtig}</span>`;
    } else {
        box.innerHTML = `richtig: <span id="spielRichtig">${spiel.richtig}</span>/<span id="spielGesamt">${spiel.gesamt}</span>`;
    }
}

/* Bei "gemischt" wird für jede Aufgabe neu gewürfelt, aus welchem
   Thema sie kommt. */
function aktuellesThema() {
    if (spiel.modus !== 'gemischt') return spiel.thema;
    const alle = Object.keys(themen);
    return themen[waehle(alle)];
}

function naechsteAufgabe() {
    const thema = aktuellesThema();
    const bereich = thema.reihen;
    let reihen = spiel.reihen;
    /* Im gemischten Modus gibt es keine ausgewählten Reihen - dort
       zählt der ganze Bereich des jeweiligen Themas. */
    if (spiel.modus === 'gemischt' && bereich) {
        reihen = [];
        for (let r = bereich.von; r <= bereich.bis; r++) reihen.push(r);
    }

    let aufgabe;
    let versuch = 0;
    /* Nicht zweimal dieselbe Frage hintereinander. Nach ein paar
       Anläufen wird sie trotzdem genommen - bei nur einer gewählten
       Reihe gibt es sonst zu wenig Auswahl. */
    do {
        aufgabe = thema.aufgabe(reihen);
        versuch++;
    } while (aufgabenKennung(aufgabe) === spiel.letzteFrage && versuch < 8);

    aufgabe.thema = thema;
    spiel.aufgabe = aufgabe;
    spiel.letzteFrage = aufgabenKennung(aufgabe);
    spiel.versuche = 1;
    spiel.coachBenutzt = false;

    // Sachaufgabentext
    const textBox = document.getElementById('spielText');
    textBox.hidden = !aufgabe.text;
    textBox.innerText = aufgabe.text || '';

    /* Bei Sachaufgaben steht keine Rechnung da - sie zu finden ist ja
       gerade die Aufgabe. Dann bleibt die Zeile weg. */
    const frageBox = document.getElementById('spielFrage');
    frageBox.hidden = !aufgabe.frage;
    frageBox.innerText = aufgabe.frage ? `${aufgabe.frage} =` : '';
    document.getElementById('spielHinweis').innerText = '';

    // Eingabefelder vorbereiten
    const restBox = document.getElementById('feldRestBox');
    restBox.hidden = aufgabe.rest === undefined;
    const feldA = document.getElementById('feldAntwort');
    const feldR = document.getElementById('feldRest');
    feldA.value = '';
    feldR.value = '';
    feldA.classList.remove('richtig', 'falsch');
    feldR.classList.remove('richtig', 'falsch');
    setzeAktivesFeld('antwort');

    // Lerncoach nur bei Themen, die einen haben
    const hatCoach = typeof aufgabe.thema.coach === 'function';
    document.getElementById('coachToggle').hidden = !hatCoach;
    schliesseCoach();

    aktualisiereFortschritt();
}

/* Woran erkennen wir "dieselbe Aufgabe wie eben"? An der Rechnung -
   und bei Sachaufgaben, die keine anzeigen, am Text. */
function aufgabenKennung(aufgabe) {
    return aufgabe.frage || aufgabe.text || '';
}

function setzeAktivesFeld(name) {
    spiel.aktivesFeld = name;
    document.getElementById('feldAntwortBox').classList.toggle('aktiv', name === 'antwort');
    document.getElementById('feldRestBox').classList.toggle('aktiv', name === 'rest');
}

function aktivesEingabefeld() {
    return document.getElementById(spiel.aktivesFeld === 'rest' ? 'feldRest' : 'feldAntwort');
}

function addDigit(d) {
    const feld = aktivesEingabefeld();
    if (feld.value.length < 4) feld.value += d;
}

function deleteDigit() {
    const feld = aktivesEingabefeld();
    feld.value = feld.value.slice(0, -1);
}

function pruefeAntwort() {
    const aufgabe = spiel.aufgabe;
    if (!aufgabe) return;
    const feldA = document.getElementById('feldAntwort');
    const feldR = document.getElementById('feldRest');
    const brauchtRest = aufgabe.rest !== undefined;

    if (feldA.value === '' || (brauchtRest && feldR.value === '')) {
        document.getElementById('spielHinweis').innerText = brauchtRest
            ? 'Trage Ergebnis und Rest ein.'
            : 'Trage dein Ergebnis ein.';
        return;
    }

    const antwortOk = parseInt(feldA.value, 10) === aufgabe.antwort;
    const restOk = !brauchtRest || parseInt(feldR.value, 10) === aufgabe.rest;

    if (antwortOk && restOk) {
        spiel.richtig++;
        spiel.gesamt++;
        if (spiel.coachBenutzt) spiel.mitCoach++;
        feldA.classList.add('richtig');
        if (brauchtRest) feldR.classList.add('richtig');
        aktualisiereFortschritt();

        if (spiel.ziel && spiel.gesamt >= spiel.ziel) { endeRunde(); return; }
        setTimeout(naechsteAufgabe, 450);
        return;
    }

    /* Erster Fehlversuch: Hinweis und noch einmal probieren.
       Zweiter: Lösung zeigen und weiter - niemand soll vor einer
       verschlossenen Tür sitzen bleiben. */
    if (!antwortOk) feldA.classList.add('falsch');
    if (brauchtRest && !restOk) feldR.classList.add('falsch');

    if (spiel.versuche === 1) {
        spiel.versuche = 2;
        document.getElementById('spielHinweis').innerText = aufgabe.hinweis || 'Versuch es noch einmal.';
        setTimeout(() => {
            feldA.classList.remove('falsch');
            feldR.classList.remove('falsch');
            if (!antwortOk) feldA.value = '';
            if (brauchtRest && !restOk) feldR.value = '';
            setzeAktivesFeld(!antwortOk ? 'antwort' : 'rest');
        }, 700);
        return;
    }

    spiel.gesamt++;
    aktualisiereFortschritt();
    /* Bei Sachaufgaben gehört die Rechnung mit in die Auflösung - das
       Aufstellen ist der Teil, der geübt wird. */
    const loesung = aufgabe.rechnung
        ? `${aufgabe.rechnung} = ${aufgabe.antwort}`
        : `${aufgabe.antwort}`;
    document.getElementById('spielHinweis').innerText = brauchtRest
        ? `Die Lösung ist ${loesung} Rest ${aufgabe.rest}.`
        : `Die Lösung ist ${loesung}.`;

    if (spiel.ziel && spiel.gesamt >= spiel.ziel) { setTimeout(endeRunde, 1800); return; }
    setTimeout(naechsteAufgabe, 1800);
}

/* Enter prüft ebenfalls - wer eine Tastatur hat, soll sie nutzen. */
document.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    if (document.getElementById('spielScreen').classList.contains('active')) pruefeAntwort();
});

document.addEventListener('input', event => {
    if (event.target && event.target.id === 'coachNotiz') {
        coachNotiz = event.target.value;
    }
});


/* ============================================================
   6. Lerncoach

   Er begleitet die Themen mit Zehnerübergang in drei Schritten.
   Die Frage steht zuerst allein da - der Tipp kommt erst auf
   Wunsch, damit erst selbst gedacht wird.
   ============================================================ */

let coachOffen = false;
let coachSchritt = 0;
let coachSchritte = [];
let coachNotiz = '';

function toggleCoach() {
    if (coachOffen) { schliesseCoach(); return; }
    const thema = spiel.aufgabe && spiel.aufgabe.thema;
    if (!thema || typeof thema.coach !== 'function') return;

    coachSchritte = thema.coach(spiel.aufgabe);
    coachSchritt = 0;
    coachNotiz = '';
    coachOffen = true;
    spiel.coachBenutzt = true;
    document.getElementById('coachPanel').hidden = false;
    document.getElementById('coachToggle').classList.add('an');
    renderCoach(false);
}

function schliesseCoach() {
    coachOffen = false;
    const panel = document.getElementById('coachPanel');
    if (panel) panel.hidden = true;
    const knopf = document.getElementById('coachToggle');
    if (knopf) knopf.classList.remove('an');
}

function renderCoach(mitAntwort) {
    const schritt = coachSchritte[coachSchritt];
    if (!schritt) return;

    const notizFeld = document.getElementById('coachNotiz');
    if (notizFeld) {
        notizFeld.value = coachNotiz;
        notizFeld.placeholder = schritt.notiz || 'z. B. 27 + 3 = 30';
    }

    document.getElementById('coachMessage').innerHTML =
        `<strong>Schritt ${coachSchritt + 1} von ${coachSchritte.length}</strong><br>${schritt.frage}` +
        (mitAntwort ? `<br><em>${schritt.antwort}</em>` : '') +
        (schritt.notiz ? `<br><small>Notiere: ${schritt.notiz}</small>` : '');
}

function coachAntwort() { renderCoach(true); }

function coachWeiter() {
    if (coachSchritt < coachSchritte.length - 1) {
        coachSchritt++;
        renderCoach(false);
    }
}

function coachZurueck() {
    if (coachSchritt > 0) {
        coachSchritt--;
        renderCoach(false);
    }
}


/* ============================================================
   7. Ergebnis
   ============================================================ */

function endeRunde() {
    if (spiel.timerInterval) { clearInterval(spiel.timerInterval); spiel.timerInterval = null; }

    document.getElementById('ergebnisRichtig').innerText = spiel.richtig;
    document.getElementById('ergebnisGesamt').innerText = spiel.gesamt;
    document.getElementById('ergebnisCoach').innerText = spiel.mitCoach;

    const gebraucht = spiel.timed ? spiel.dauer - spiel.timer : null;
    document.getElementById('ergebnisZeit').innerText = gebraucht === null
        ? 'eigenes Tempo'
        : `${Math.floor(gebraucht / 60)}:${String(gebraucht % 60).padStart(2, '0')} min`;

    const quote = spiel.gesamt ? spiel.richtig / spiel.gesamt : 0;
    const sterne = spiel.gesamt === 0 ? 0 : Math.max(1, Math.round(quote * 5));
    document.getElementById('ergebnisSterne').innerText = '★'.repeat(sterne) + '☆'.repeat(5 - sterne);

    let lob = 'Weiter so!';
    if (spiel.gesamt === 0) lob = 'Beim nächsten Mal geht es los!';
    else if (quote >= 0.95) lob = 'Fast alles richtig. Stark!';
    else if (quote >= 0.8) lob = 'Richtig gut gerechnet!';
    else if (quote >= 0.5) lob = 'Schon viel geschafft. Übe weiter!';
    else lob = 'Übung macht die Meisterin. Bleib dran!';

    document.getElementById('ergebnisTitel').innerText =
        spiel.ziel && spiel.gesamt >= spiel.ziel ? 'Alle 100 geschafft!' : 'Runde beendet!';
    document.getElementById('ergebnisLob').innerText = lob;

    showScreen('ergebnisScreen');
}

function nochEinmal() {
    if (spiel.modus === 'gemischt') { startGemischt(); return; }
    if (spiel.modus === 'challenge') { startChallenge(spiel.themaKey); return; }
    startEinzeln(spiel.timed);
}


/* ============================================
   Start
   ============================================ */
initThemen();
if (kannVorlesen()) window.speechSynthesis.onvoiceschanged = () => deutscheStimme();
