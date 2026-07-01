// Birthday Surprise Website Configuration
const CONFIG = {
  // Birthday Star Info
  recipientName: "Sarah",
  recipientNickname: "my absolute favorite human",
  birthdayDate: "July 1st", // Used in count down/display

  // Background Music
  // You can replace this link with any direct mp3 link (e.g. from Google Drive, Dropbox, or a public CDN)
  musicUrl: "love.mp3?v=2",
  musicVolume: 0.3,

  // Balloons Game Settings
  // Keywords that pop up when each balloon is popped
  balloonKeywords: [
    "Our First Date ☕",
    "Late Night Walks 🌙",
    "Cozy Coffee Mornings",
    "Endless Laughter 😂",
    "Road Trips 🚗",
    "Your Warm Smile",
    "Kind Soul ✨",
    "Growing Together"
  ],

  // Memories Slideshow/Gallery
  // Keep the filenames consistent with what you upload or use the generated assets
  memories: [
    {
      url: "assets/memory1.png",
      caption: "Where it all began - that unforgettable evening."
    },
    {
      url: "assets/memory2.png",
      caption: "Cozy coffee dates and hours of talking about everything."
    },
    {
      url: "assets/memory3.png",
      caption: "Our adventurous weekend getaway under the golden sky."
    },
    {
      url: "assets/memory4.png",
      caption: "Starry night bonfires and sharing dreams for the future."
    }
  ],

  // Personal Letter Content
  // Supports basic text structure. It will type out character by character.
  letterText: `My Dearest Sarah,

Happy Birthday to the most wonderful person in my life! ❤️

Today is all about celebrating you—the beautiful light you bring into this world, your infectious laughter that can brighten even the darkest days, and the incredible kindness you show to everyone around you.

Every single moment spent with you is a treasure. From our quiet coffee mornings to our wild road trips, you make every day feel like a beautiful adventure. I am so incredibly grateful for your love, your patience, and your presence in my life.

I hope this little website brings a smile to your face, just like you do to mine every single day. May this year bring you endless joy, peace, success, and all the happiness you deserve.

I love you endlessly, always and forever.

Yours,
[Your Name] 💍`,

  // Grand Finale Settings
  // Can be a YouTube embed video or a custom message
  // To use a YouTube video, get the embed link (e.g., https://www.youtube.com/embed/VIDEO_ID)
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with your video or leave empty for a message surprise
  finaleText: "Happy Birthday, My Star! ✨ May all your wishes come true today and always.",

  // Easter Eggs
  hiddenMessage: "Psst... You found the secret message! I have a special dinner reservation for us tonight at 7 PM. Dress up! 😉",
  konamiCodeResponse: "💖 UNLIMITED LOVE MODE ACTIVATED 💖"
};

// Export config for module usage if needed (or keep global)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
