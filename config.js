// Birthday Surprise Website Configuration
const CONFIG = {
  // Birthday Star Info
  recipientName: "yamuna",
  recipientNickname: "my absolute favorite human",
  birthdayDate: "July 1st", // Used in count down/display

  // Background Music
  // You can replace this link with any direct mp3 link (e.g. from Google Drive, Dropbox, or a public CDN)
  musicUrl: "love.mp3?v=2",
  musicVolume: 0.3,

  // Balloons Game Settings
  // Keywords that pop up when each balloon is popped
  balloonKeywords: [
    "hand touching🫴",
    "eye to eye contact👀",
    "sighting😉",
    "cute smile😊",
    "insta talk💬",
    "cuteness 😍",
    "childness👶",
    "Growing Together ❤️‍🩹"
  ],

  // Memories Slideshow/Gallery
  // Keep the filenames consistent with what you upload or use the generated assets
  memories: [
    {
      url: "assets/memory1.png",
      caption: "💜"
    },
    {
      url: "assets/memory2.png",
      caption: "💘"
    },
    {
      url: "assets/memory3.png",
      caption: "😍"
    },
    {
      url: "assets/memory4.png",
      caption: "🫀"
    }
  ],

  // Personal Letter Content
  // Supports basic text structure. It will type out character by character.
  letterText: `My Dearest Yamuna,

Hiiii first of all wish you many more happy returns of the day thango ❤️ life long happy iru eppothum smile panithe iru ♾️  entha problem vanthalum na eruken un kuda last varaikum erupen etho oru relationship la     
Enaku unna pudichi eruku en ketha sola teriyala un kuda life share panumnu thonuthu ethu thapa correct nu kuda teriyala na already oru love pana Athuku aprm love venanu tha eruten Athuku aprm reason ellamatha unna pudichithu ippo love panurathu kuda sari kedayathu tha school exam spoil agum Athuku first nee enna love panumla😅 parava wait panuven evlo nal venalum unaku enaiya pudikum appo solu enaku oru fixed mind set ella na panurathu correct thapunu kuda teriyala oru vela nee love ok sonala last varaikum erupiya ella pathila vithu poiduviya Ennanu teriyamale eruku  miss paniduvono ella love panalum pathile vithu poiduviyo ella mandaikulla odithu bayamve eruku nee oru family sentiment vera ulla ponna vethula othukala vena appadi solithu poiduviyo nu vera oru bayam nee oru vathiyum nala pesurapa seri unaku enna pudikum appdinu nenaipen enna nanaikuren ennae teriya mandaye vedichirum pola erukum  anyways exam nala score panu tirupiyum Happy Birthday and kuda eruthu celebrate panum asa paten mudiyala miss you so much happya iru 💜👀♾️🫂    sorry ethum thapa pesi erutha solanum thonuchi soliten

I love you endlessly, always and forever.

Yours,
[sk] 💍`,

  // Grand Finale Settings
  // Can be a YouTube embed video or a custom message
  // To use a YouTube video, get the embed link (e.g., https://www.youtube.com/embed/VIDEO_ID)
  videoUrl: "", // Leave empty — no video
  finaleText: "Happy Birthday, My Star! ✨ May all your wishes come true today and always.",

  // Easter Eggs
  hiddenMessage: "Psst... You found the secret message! I have a special dinner reservation for us tonight at 7 PM. Dress up! 😉",
  konamiCodeResponse: "💖 UNLIMITED LOVE MODE ACTIVATED 💖"
};

// Export config for module usage if needed (or keep global)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
