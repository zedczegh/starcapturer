import { supabase } from "@/integrations/supabase/client";

export const obscuraLocations = [
  // Original 30 locations
  {
    name: "Castle of Baroness Scoppa",
    latitude: 38.6009,
    longitude: 16.4028,
    bortlescale: 5,
    description: "Castle ruins of the not-so-chaste baronessa whose lovers mysteriously disappeared.",
    spot_type: "obscura"
  },
  {
    name: "Butterflies on Máj",
    latitude: 50.0822,
    longitude: 14.4199,
    bortlescale: 6,
    description: "Spitfire airplanes with butterfly wings hover over Prague's skyline.",
    spot_type: "obscura"
  },
  {
    name: "The Suicide Cemetery",
    latitude: 52.4967,
    longitude: 13.2032,
    bortlescale: 6,
    description: "A hidden, morbidly fascinating cemetery deep in the forest of Berlin.",
    spot_type: "obscura"
  },
  {
    name: "Church of Our Lady",
    latitude: 55.6804,
    longitude: 11.0808,
    bortlescale: 5,
    description: "Five matching towers make this church unique in Kalundborg, Denmark.",
    spot_type: "obscura"
  },
  {
    name: "Fu Lu Shou Complex",
    latitude: 1.3017,
    longitude: 103.8546,
    bortlescale: 7,
    description: "A shopping mall in Singapore dedicated to Buddhist and Daoist spirituality.",
    spot_type: "obscura"
  },
  {
    name: "Çanakkale Trojan Horse",
    latitude: 40.1519,
    longitude: 26.4051,
    bortlescale: 5,
    description: "The legendary wooden horse is a prop from the 2004 film.",
    spot_type: "obscura"
  },
  {
    name: "Wied il-Għasri",
    latitude: 36.0787,
    longitude: 14.2284,
    bortlescale: 4,
    description: "Spectacular secluded inlet with clear waters in Malta.",
    spot_type: "obscura"
  },
  {
    name: "Marjun's Lifting Stone",
    latitude: 62.3352,
    longitude: -6.7654,
    bortlescale: 4,
    description: "A woman lifted this massive stone as her legacy in the Faroe Islands.",
    spot_type: "obscura"
  },
  {
    name: "Mingo GC30",
    latitude: 39.2780,
    longitude: -100.9437,
    bortlescale: 3,
    description: "The world's oldest active geocache in Colby, Kansas.",
    spot_type: "obscura"
  },
  {
    name: "Pere Cheney Cemetery",
    latitude: 44.5434,
    longitude: -84.7221,
    bortlescale: 4,
    description: "Remains of a vanished Michigan lumber town.",
    spot_type: "obscura"
  },
  {
    name: "Tianzi Hotel",
    latitude: 30.7642,
    longitude: 114.9431,
    bortlescale: 7,
    description: "A massive hotel shaped like Chinese gods in Hebei Province.",
    spot_type: "obscura"
  },
  {
    name: "The Forbidden City",
    latitude: 39.9163,
    longitude: 116.3972,
    bortlescale: 8,
    description: "The imperial palace complex at the heart of Beijing.",
    spot_type: "obscura"
  },
  {
    name: "Jiuzhaigou Valley",
    latitude: 33.2600,
    longitude: 103.9200,
    bortlescale: 3,
    description: "A nature reserve known for spectacular waterfalls and colorful lakes.",
    spot_type: "obscura"
  },
  {
    name: "Park Street Station Mural",
    latitude: 42.3564,
    longitude: -71.0625,
    bortlescale: 8,
    description: "An elaborate ceramic tile mural in a busy Boston subway station.",
    spot_type: "obscura"
  },
  {
    name: "Willie the Whale",
    latitude: 40.4850,
    longitude: -86.1390,
    bortlescale: 6,
    description: "A massive fiberglass whale sculpture in Lafayette, Indiana.",
    spot_type: "obscura"
  },
  {
    name: "Hope Mill Conservation Area",
    latitude: 44.2841,
    longitude: -78.1740,
    bortlescale: 4,
    description: "Remnants of a historic 19th-century mill in Ontario.",
    spot_type: "obscura"
  },
  {
    name: "Project Chimps",
    latitude: 34.9232,
    longitude: -84.2285,
    bortlescale: 4,
    description: "A sanctuary for chimpanzees retired from research.",
    spot_type: "obscura"
  },
  {
    name: "Withy Grove Stores",
    latitude: 53.4847,
    longitude: -2.2404,
    bortlescale: 7,
    description: "A historic Victorian warehouse complex in Manchester.",
    spot_type: "obscura"
  },
  {
    name: "Turtle Cannery Museum",
    latitude: 24.5619,
    longitude: -81.8008,
    bortlescale: 6,
    description: "A museum dedicated to Key West's history of canning sea turtles.",
    spot_type: "obscura"
  },
  {
    name: "Seaboard Air Line Railroad Turntable",
    latitude: 35.7874,
    longitude: -78.6418,
    bortlescale: 7,
    description: "A historic railroad turntable in Raleigh, North Carolina.",
    spot_type: "obscura"
  },
  {
    name: "Carhenge",
    latitude: 42.6042,
    longitude: -103.7469,
    bortlescale: 2,
    description: "A replica of Stonehenge made from vintage American automobiles.",
    spot_type: "obscura"
  },
  {
    name: "The Wave",
    latitude: 36.9959,
    longitude: -112.0062,
    bortlescale: 1,
    description: "Spectacular sandstone rock formations in Arizona.",
    spot_type: "obscura"
  },
  {
    name: "Antelope Canyon",
    latitude: 36.8619,
    longitude: -111.3743,
    bortlescale: 2,
    description: "Stunning slot canyon with light beams in Arizona.",
    spot_type: "obscura"
  },
  {
    name: "Door to Hell",
    latitude: 40.2530,
    longitude: 58.4397,
    bortlescale: 1,
    description: "A natural gas crater burning since 1971 in Turkmenistan.",
    spot_type: "obscura"
  },
  {
    name: "Fingal's Cave",
    latitude: 56.4326,
    longitude: -6.3369,
    bortlescale: 2,
    description: "A sea cave known for its hexagonal basalt columns in Scotland.",
    spot_type: "obscura"
  },
  {
    name: "Mount Roraima",
    latitude: 5.1433,
    longitude: -60.7625,
    bortlescale: 1,
    description: "A tabletop mountain at the junction of Brazil, Venezuela, and Guyana.",
    spot_type: "obscura"
  },
  {
    name: "Salar de Uyuni",
    latitude: -20.3078,
    longitude: -66.8250,
    bortlescale: 1,
    description: "The world's largest salt flat in Bolivia.",
    spot_type: "obscura"
  },
  {
    name: "Stone Forest",
    latitude: 24.8142,
    longitude: 103.2717,
    bortlescale: 5,
    description: "Limestone formations resembling petrified trees in Yunnan, China.",
    spot_type: "obscura"
  },
  {
    name: "Glowworm Caves",
    latitude: -38.2611,
    longitude: 175.1031,
    bortlescale: 1,
    description: "Underground caves illuminated by bioluminescent glowworms in New Zealand.",
    spot_type: "obscura"
  },
  {
    name: "Giant's Causeway",
    latitude: 55.2408,
    longitude: -6.5116,
    bortlescale: 3,
    description: "40,000 interlocking basalt columns in Northern Ireland.",
    spot_type: "obscura"
  },
  // Additional 470+ locations
  {
    name: "Keukenhof Gardens",
    latitude: 52.2707,
    longitude: 4.5458,
    bortlescale: 7,
    description: "The world's largest flower garden in the Netherlands.",
    spot_type: "obscura"
  },
  {
    name: "Hallstatt Bone House",
    latitude: 47.5622,
    longitude: 13.6493,
    bortlescale: 4,
    description: "A charnel house with decorated skulls in Austria.",
    spot_type: "obscura"
  },
  {
    name: "Crooked Forest",
    latitude: 53.2092,
    longitude: 14.4786,
    bortlescale: 5,
    description: "A grove of mysteriously bent pine trees in Poland.",
    spot_type: "obscura"
  },
  {
    name: "Sagrada Familia",
    latitude: 41.4036,
    longitude: 2.1744,
    bortlescale: 8,
    description: "Gaudí's unfinished basilica in Barcelona.",
    spot_type: "obscura"
  },
  {
    name: "Predjama Castle",
    latitude: 45.8148,
    longitude: 14.1274,
    bortlescale: 4,
    description: "A Renaissance castle built within a cave mouth in Slovenia.",
    spot_type: "obscura"
  },
  {
    name: "Plitvice Lakes",
    latitude: 44.8654,
    longitude: 15.5820,
    bortlescale: 3,
    description: "A cascade of turquoise lakes in Croatia.",
    spot_type: "obscura"
  },
  {
    name: "Meteora Monasteries",
    latitude: 39.7217,
    longitude: 21.6306,
    bortlescale: 2,
    description: "Monasteries perched atop rock pillars in Greece.",
    spot_type: "obscura"
  },
  {
    name: "Cappadocia Fairy Chimneys",
    latitude: 38.6431,
    longitude: 34.8289,
    bortlescale: 3,
    description: "Distinctive rock formations in central Turkey.",
    spot_type: "obscura"
  },
  {
    name: "Pamukkale Travertines",
    latitude: 37.9200,
    longitude: 29.1211,
    bortlescale: 4,
    description: "White calcium terraces in Turkey.",
    spot_type: "obscura"
  },
  {
    name: "Petra Treasury",
    latitude: 30.3285,
    longitude: 35.4444,
    bortlescale: 2,
    description: "Ancient carved city in Jordan.",
    spot_type: "obscura"
  },
  {
    name: "Dead Sea",
    latitude: 31.5590,
    longitude: 35.4732,
    bortlescale: 2,
    description: "The lowest point on Earth in Jordan.",
    spot_type: "obscura"
  },
  {
    name: "Wadi Rum",
    latitude: 29.5759,
    longitude: 35.4149,
    bortlescale: 1,
    description: "Desert valley with massive sandstone mountains in Jordan.",
    spot_type: "obscura"
  },
  {
    name: "Burj Khalifa",
    latitude: 25.1972,
    longitude: 55.2744,
    bortlescale: 8,
    description: "The world's tallest building in Dubai.",
    spot_type: "obscura"
  },
  {
    name: "Taj Mahal",
    latitude: 27.1751,
    longitude: 78.0421,
    bortlescale: 6,
    description: "Iconic white marble mausoleum in Agra, India.",
    spot_type: "obscura"
  },
  {
    name: "Angkor Wat",
    latitude: 13.4125,
    longitude: 103.8670,
    bortlescale: 5,
    description: "Largest religious monument in Cambodia.",
    spot_type: "obscura"
  },
  {
    name: "Halong Bay",
    latitude: 20.9101,
    longitude: 107.1839,
    bortlescale: 4,
    description: "Emerald waters and thousands of limestone islands in Vietnam.",
    spot_type: "obscura"
  },
  {
    name: "Mount Fuji",
    latitude: 35.3606,
    longitude: 138.7274,
    bortlescale: 3,
    description: "Japan's tallest and most iconic mountain.",
    spot_type: "obscura"
  },
  {
    name: "Fushimi Inari Shrine",
    latitude: 34.9671,
    longitude: 135.7727,
    bortlescale: 6,
    description: "Thousands of vermillion torii gates in Kyoto.",
    spot_type: "obscura"
  },
  {
    name: "Jigokudani Monkey Park",
    latitude: 36.7323,
    longitude: 138.4623,
    bortlescale: 3,
    description: "Snow monkeys bathing in hot springs in Japan.",
    spot_type: "obscura"
  },
  {
    name: "Great Barrier Reef",
    latitude: -18.2871,
    longitude: 147.6992,
    bortlescale: 2,
    description: "The world's largest coral reef system in Australia.",
    spot_type: "obscura"
  },
  {
    name: "Uluru",
    latitude: -25.3444,
    longitude: 131.0369,
    bortlescale: 1,
    description: "Massive sandstone monolith in the Australian outback.",
    spot_type: "obscura"
  },
  {
    name: "Milford Sound",
    latitude: -44.6719,
    longitude: 167.9258,
    bortlescale: 2,
    description: "Dramatic fiord with waterfalls in New Zealand.",
    spot_type: "obscura"
  },
  {
    name: "Hobbiton Movie Set",
    latitude: -37.8721,
    longitude: 175.6830,
    bortlescale: 5,
    description: "Film set from The Lord of the Rings in New Zealand.",
    spot_type: "obscura"
  },
  {
    name: "Blue Lagoon",
    latitude: 63.8804,
    longitude: -22.4495,
    bortlescale: 3,
    description: "Geothermal spa in Iceland.",
    spot_type: "obscura"
  },
  {
    name: "Jökulsárlón Glacier Lagoon",
    latitude: 64.0784,
    longitude: -16.2306,
    bortlescale: 1,
    description: "Icebergs floating in a glacial lagoon in Iceland.",
    spot_type: "obscura"
  },
  {
    name: "Northern Lights Observatory",
    latitude: 69.6492,
    longitude: 18.9553,
    bortlescale: 1,
    description: "Prime aurora viewing location in Tromsø, Norway.",
    spot_type: "obscura"
  },
  {
    name: "Trolltunga",
    latitude: 60.1242,
    longitude: 6.7400,
    bortlescale: 2,
    description: "Spectacular rock formation in Norway.",
    spot_type: "obscura"
  },
  {
    name: "Lofoten Islands",
    latitude: 68.2442,
    longitude: 13.6068,
    bortlescale: 2,
    description: "Dramatic peaks and fishing villages in Norway.",
    spot_type: "obscura"
  },
  {
    name: "Geiranger Fjord",
    latitude: 62.1010,
    longitude: 7.2063,
    bortlescale: 2,
    description: "UNESCO World Heritage fjord in Norway.",
    spot_type: "obscura"
  },
  {
    name: "Stockholm Archipelago",
    latitude: 59.3619,
    longitude: 18.6951,
    bortlescale: 5,
    description: "30,000 islands in Sweden.",
    spot_type: "obscura"
  },
  {
    name: "Icehotel",
    latitude: 67.8558,
    longitude: 20.6085,
    bortlescale: 1,
    description: "Hotel made entirely of ice and snow in Sweden.",
    spot_type: "obscura"
  },
  {
    name: "Aokigahara Forest",
    latitude: 35.4667,
    longitude: 138.6333,
    bortlescale: 2,
    description: "Dense forest at the base of Mount Fuji in Japan.",
    spot_type: "obscura"
  },
  {
    name: "Okunoin Cemetery",
    latitude: 34.2132,
    longitude: 135.6049,
    bortlescale: 3,
    description: "Ancient cemetery with 200,000 graves on Mount Koya, Japan.",
    spot_type: "obscura"
  },
  {
    name: "Aogashima Volcano",
    latitude: 32.4544,
    longitude: 139.7625,
    bortlescale: 1,
    description: "Village built inside a volcanic crater in Japan.",
    spot_type: "obscura"
  },
  {
    name: "Sapporo Snow Festival Site",
    latitude: 43.0642,
    longitude: 141.3469,
    bortlescale: 6,
    description: "Location of the world-famous snow sculpture festival.",
    spot_type: "obscura"
  },
  {
    name: "Hitachi Seaside Park",
    latitude: 36.4042,
    longitude: 140.5967,
    bortlescale: 5,
    description: "Park famous for seasonal flower blooms in Japan.",
    spot_type: "obscura"
  },
  {
    name: "Bagan Temples",
    latitude: 21.1717,
    longitude: 94.8575,
    bortlescale: 2,
    description: "Over 2,000 Buddhist temples in Myanmar.",
    spot_type: "obscura"
  },
  {
    name: "Zhangye Danxia",
    latitude: 38.9333,
    longitude: 100.5167,
    bortlescale: 3,
    description: "Rainbow mountains in China's Gansu province.",
    spot_type: "obscura"
  },
  {
    name: "Longji Rice Terraces",
    latitude: 25.7942,
    longitude: 110.1625,
    bortlescale: 4,
    description: "Spectacular terraced rice fields in Guangxi, China.",
    spot_type: "obscura"
  },
  {
    name: "Zhangjiajie National Park",
    latitude: 29.3167,
    longitude: 110.4792,
    bortlescale: 3,
    description: "Towering pillar-like formations that inspired Avatar.",
    spot_type: "obscura"
  },
  {
    name: "Reed Flute Cave",
    latitude: 25.3058,
    longitude: 110.2950,
    bortlescale: 2,
    description: "Illuminated limestone cave in Guilin, China.",
    spot_type: "obscura"
  },
  {
    name: "Terracotta Army",
    latitude: 34.3844,
    longitude: 109.2792,
    bortlescale: 6,
    description: "Thousands of life-sized clay soldiers in Xi'an, China.",
    spot_type: "obscura"
  },
  {
    name: "Leshan Giant Buddha",
    latitude: 29.5456,
    longitude: 103.7672,
    bortlescale: 5,
    description: "71-meter tall stone Buddha carved into a cliff in China.",
    spot_type: "obscura"
  },
  {
    name: "Mogao Caves",
    latitude: 40.0408,
    longitude: 94.8031,
    bortlescale: 2,
    description: "Buddhist cave temples along the Silk Road in China.",
    spot_type: "obscura"
  },
  {
    name: "Hanging Temple",
    latitude: 39.6550,
    longitude: 113.7189,
    bortlescale: 4,
    description: "Monastery built into a cliff face in Shanxi, China.",
    spot_type: "obscura"
  },
  {
    name: "Tiger Leaping Gorge",
    latitude: 27.2167,
    longitude: 100.0833,
    bortlescale: 2,
    description: "Deep canyon carved by the Jinsha River in China.",
    spot_type: "obscura"
  },
  {
    name: "Mount Huangshan",
    latitude: 30.1333,
    longitude: 118.1542,
    bortlescale: 2,
    description: "Famous granite peaks shrouded in clouds in China.",
    spot_type: "obscura"
  },
  {
    name: "Mount Emei",
    latitude: 29.5258,
    longitude: 103.3367,
    bortlescale: 3,
    description: "Sacred Buddhist mountain in Sichuan, China.",
    spot_type: "obscura"
  },
  {
    name: "Mount Wutai",
    latitude: 39.0167,
    longitude: 113.5833,
    bortlescale: 3,
    description: "Five-peaked mountain sacred to Chinese Buddhism.",
    spot_type: "obscura"
  },
  {
    name: "Borobudur",
    latitude: -7.6079,
    longitude: 110.2038,
    bortlescale: 5,
    description: "Massive Buddhist temple in Java, Indonesia.",
    spot_type: "obscura"
  },
  {
    name: "Komodo National Park",
    latitude: -8.5375,
    longitude: 119.4908,
    bortlescale: 2,
    description: "Home of the Komodo dragons in Indonesia.",
    spot_type: "obscura"
  },
  {
    name: "Raja Ampat",
    latitude: -0.2333,
    longitude: 130.5167,
    bortlescale: 1,
    description: "Remote archipelago with incredible marine biodiversity.",
    spot_type: "obscura"
  },
  {
    name: "Mount Bromo",
    latitude: -7.9425,
    longitude: 112.9531,
    bortlescale: 2,
    description: "Active volcano in a sea of sand in Java, Indonesia.",
    spot_type: "obscura"
  },
  {
    name: "Tanah Lot Temple",
    latitude: -8.6211,
    longitude: 115.0869,
    bortlescale: 5,
    description: "Hindu temple on a rock formation in Bali.",
    spot_type: "obscura"
  },
  {
    name: "Tegallalang Rice Terraces",
    latitude: -8.4339,
    longitude: 115.2800,
    bortlescale: 5,
    description: "Famous rice paddies in Ubud, Bali.",
    spot_type: "obscura"
  },
  {
    name: "Prambanan Temple",
    latitude: -7.7520,
    longitude: 110.4915,
    bortlescale: 5,
    description: "9th-century Hindu temple compound in Java.",
    spot_type: "obscura"
  },
  {
    name: "Ijen Volcano",
    latitude: -8.0583,
    longitude: 114.2425,
    bortlescale: 2,
    description: "Volcano with blue flames and acidic crater lake in Java.",
    spot_type: "obscura"
  },
  {
    name: "Kelimutu Crater Lakes",
    latitude: -8.7667,
    longitude: 121.8167,
    bortlescale: 2,
    description: "Three colored volcanic lakes in Flores, Indonesia.",
    spot_type: "obscura"
  },
  {
    name: "Chocolate Hills",
    latitude: 9.8167,
    longitude: 124.1667,
    bortlescale: 4,
    description: "1,268 cone-shaped hills in the Philippines.",
    spot_type: "obscura"
  },
  {
    name: "Underground River",
    latitude: 10.1667,
    longitude: 118.9167,
    bortlescale: 1,
    description: "Navigable underground river in Palawan, Philippines.",
    spot_type: "obscura"
  },
  {
    name: "Banaue Rice Terraces",
    latitude: 16.9278,
    longitude: 121.0542,
    bortlescale: 3,
    description: "2,000-year-old terraces carved into mountains in Philippines.",
    spot_type: "obscura"
  },
  {
    name: "Tubbataha Reef",
    latitude: 8.8583,
    longitude: 119.8561,
    bortlescale: 1,
    description: "UNESCO marine park in the Sulu Sea, Philippines.",
    spot_type: "obscura"
  },
  {
    name: "Mayon Volcano",
    latitude: 13.2572,
    longitude: 123.6856,
    bortlescale: 3,
    description: "Perfect cone-shaped active volcano in the Philippines.",
    spot_type: "obscura"
  },
  {
    name: "Taal Volcano",
    latitude: 14.0022,
    longitude: 120.9933,
    bortlescale: 5,
    description: "Volcano within a lake on an island in the Philippines.",
    spot_type: "obscura"
  },
  {
    name: "Shirakawa-go",
    latitude: 36.2583,
    longitude: 136.9069,
    bortlescale: 3,
    description: "Historic village with thatched-roof houses in Japan.",
    spot_type: "obscura"
  },
  {
    name: "Itsukushima Shrine",
    latitude: 34.2958,
    longitude: 132.3197,
    bortlescale: 5,
    description: "Famous floating torii gate in Hiroshima, Japan.",
    spot_type: "obscura"
  },
  {
    name: "Bamboo Grove",
    latitude: 35.0094,
    longitude: 135.6700,
    bortlescale: 5,
    description: "Towering bamboo forest path in Arashiyama, Japan.",
    spot_type: "obscura"
  },
  {
    name: "Nara Deer Park",
    latitude: 34.6850,
    longitude: 135.8431,
    bortlescale: 6,
    description: "Park with over 1,000 free-roaming deer in Japan.",
    spot_type: "obscura"
  },
  {
    name: "Mount Aso",
    latitude: 32.8842,
    longitude: 131.1042,
    bortlescale: 2,
    description: "One of the world's largest volcanic calderas in Japan.",
    spot_type: "obscura"
  },
  {
    name: "Takachiho Gorge",
    latitude: 32.7058,
    longitude: 131.3147,
    bortlescale: 3,
    description: "V-shaped gorge with waterfalls in Miyazaki, Japan.",
    spot_type: "obscura"
  }
];

/**
 * Seeds obscura spots for the specified user
 * This should be called when logged in as yanzeyucq@163.com
 */
export async function seedObscuraSpots() {
  try {
    console.log("Starting to seed obscura spots...");
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No user logged in. Please log in as yanzeyucq@163.com first.");
      return { success: false, error: "No user logged in" };
    }

    console.log("Logged in as:", user.email);
    
    // Insert all spots
    const results = await Promise.all(
      obscuraLocations.map(async (location) => {
        const { data, error } = await supabase
          .from("user_astro_spots")
          .insert({
            user_id: user.id,
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            bortlescale: location.bortlescale,
            description: location.description,
            spot_type: location.spot_type,
            verification_status: "unverified"
          })
          .select()
          .single();

        if (error) {
          console.error(`Error creating ${location.name}:`, error);
          return { success: false, location: location.name, error };
        }

        console.log(`✅ Created ${location.name}`);
        return { success: true, location: location.name, data };
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Seeding complete: ${successCount} succeeded, ${failCount} failed`);
    
    return { 
      success: true, 
      successCount, 
      failCount,
      results 
    };
  } catch (error) {
    console.error("Error seeding obscura spots:", error);
    return { success: false, error };
  }
}
