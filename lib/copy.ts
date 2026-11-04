// Flowerful copy bank. en-GB, no health or performance claims (UAE GSO 2333), no em dashes.
export type CopyGroup = "FLOURISH" | "FOCUS" | "Brand";
export const copyGroups: CopyGroup[] = ["FLOURISH", "FOCUS", "Brand"];
export const groupForProduct = (p: string): CopyGroup =>
  p === "flourish" ? "FLOURISH" : p === "focus" ? "FOCUS" : "Brand";

export const headerLines: Record<CopyGroup, string[]> = {
  FLOURISH: [
    "BLUE IS THE NEW BLACK",
    "MAIN CHARACTER BLUE",
    "PICKED FOR THE PETAL",
    "POUR IT.\nWATCH IT.\nOWN IT.",
    "RASPBERRY,\nBUT MAKE IT BLUE",
    "PETALS ON\nTHE PLAYLIST",
    "TOO GOOD\nTO GATEKEEP",
    "YOUR NEW\nSIGNATURE SHADE",
    "BLOOMS LOUDER\nTHAN WORDS",
    "SOFTLY\nUNHINGED BLUE",
  ],
  FOCUS: [
    "GOLDEN,\nNOT GATEKEPT",
    "SAFFRON SAID\nSHOW UP",
    "WARM SPICE.\nCOOL HEAD.",
    "CARDAMOM\nON CALL",
    "THE MOST ORANGE\nPART OF YOUR DAY",
    "THREADS OF GOLD,\nICE COLD",
    "SLOW SPICE,\nFAST FRIENDS",
    "QUIETLY GOLDEN",
    "SPICE THAT\nKNOWS ITS WORTH",
    "AFTER THE WORKOUT,\nBEFORE THE PLANS",
  ],
  Brand: [
    "DRINK BRIGHTER",
    "GOOD PEOPLE.\nBRIGHTER DAYS.",
    "NATURE HAS A\nBRIGHTER SIDE",
    "FOUR WAYS TO\nDRINK BRIGHTER",
    "SMALL BOTANICALS.\nBIG IMPACT.",
    "A BRIGHTER KIND\nOF ROUTINE",
    "FLOWERS,\nNOT FILLER",
    "CAN YOU NOT?\n(WE CAN.)",
    "REAL FLOWERS.\nZERO DRAMA.",
    "BOTANICALS WITH\nA SOCIAL LIFE",
    "GROWN UP,\nNOT BORING",
    "OPEN. SIP.\nSCROLL LESS.",
    "FOUR FLOWERS.\nNO NOTES.",
    "GARDEN-GRADE\nGLOW UP",
    "THE CAN YOUR\nFEED NEEDED",
    "STAY SOFT.\nDRINK BRIGHT.",
  ],
};
// first 6 Brand lines are the originals from v1
export const originalCount = 6;

// "4% sugar" line held back until checked against final can artwork
export const subLines: Record<CopyGroup, string[]> = {
  FLOURISH: ["Butterfly pea & raspberry", "Butterfly pea, raspberry, sparkle", "Brewed from real blooms", "Blue by nature"],
  FOCUS: ["Saffron & cardamom", "Saffron threads, cardamom, sparkle", "Warm spice, served cold", "Golden by nature"],
  Brand: ["Sparkling botanical refresher", "Brewed from real blooms"],
};
