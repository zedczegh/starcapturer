import { supabase } from "@/integrations/supabase/client";

export const obscuraLocations = [
  {
    name: "Castle of Baroness Scoppa",
    latitude: 38.6009,
    longitude: 16.4028,
    bortlescale: 5,
    description: "Castle ruins of the not-so-chaste baronessa whose lovers mysteriously disappeared. A mysterious and historic location in Cardinale, Italy.",
    spot_type: "obscura"
  },
  {
    name: "Butterflies on Máj",
    latitude: 50.0822,
    longitude: 14.4199,
    bortlescale: 6,
    description: "Spitfire airplanes with butterfly wings hover over Prague's skyline. An artistic marvel in the heart of Czech Republic.",
    spot_type: "obscura"
  },
  {
    name: "The Suicide Cemetery",
    latitude: 52.4967,
    longitude: 13.2032,
    bortlescale: 6,
    description: "A hidden, morbidly fascinating cemetery deep in the forest of Berlin, Germany. A place of reflection and history.",
    spot_type: "obscura"
  },
  {
    name: "Church of Our Lady",
    latitude: 55.6804,
    longitude: 11.0808,
    bortlescale: 5,
    description: "Five matching towers make this church in Kalundborg, Denmark unique. Legend credits a troll for its remarkable architecture.",
    spot_type: "obscura"
  },
  {
    name: "Fu Lu Shou Complex",
    latitude: 1.3017,
    longitude: 103.8546,
    bortlescale: 7,
    description: "A one-of-a-kind shopping mall in Singapore dedicated to Buddhist and Daoist spirituality. A unique blend of commerce and faith.",
    spot_type: "obscura"
  },
  {
    name: "Çanakkale Trojan Horse",
    latitude: 40.1519,
    longitude: 26.4051,
    bortlescale: 5,
    description: "The legendary wooden horse in Turkey is a prop from the 2004 Wolfgang Petersen film. Stands in modern Troy as a cinematic monument.",
    spot_type: "obscura"
  },
  {
    name: "Wied il-Għasri",
    latitude: 36.0787,
    longitude: 14.2284,
    bortlescale: 4,
    description: "Spectacular secluded inlet with clear waters flanked by limestone cliffs in Malta. A hidden gem of natural beauty.",
    spot_type: "obscura"
  },
  {
    name: "Marjun's Lifting Stone",
    latitude: 62.3352,
    longitude: -6.7654,
    bortlescale: 4,
    description: "A woman facing death for bearing a child out of wedlock lifted this massive stone as her legacy in the Faroe Islands. A testament to strength.",
    spot_type: "obscura"
  },
  {
    name: "Mingo GC30",
    latitude: 39.2780,
    longitude: -100.9437,
    bortlescale: 3,
    description: "This hidden treasure in Colby, Kansas is the world's oldest active geocache. A pilgrimage site for geocachers worldwide.",
    spot_type: "obscura"
  },
  {
    name: "Pere Cheney Cemetery",
    latitude: 44.5434,
    longitude: -84.7221,
    bortlescale: 4,
    description: "All that remains of a vanished Michigan lumber town, remembered for tragedy, plague, and a witch's curse.",
    spot_type: "obscura"
  },
  {
    name: "Tianzi Hotel",
    latitude: 30.7642,
    longitude: 114.9431,
    bortlescale: 7,
    description: "A massive hotel shaped like the Chinese gods of prosperity, fortune, and longevity in Hebei Province, China.",
    spot_type: "obscura"
  },
  {
    name: "The Forbidden City",
    latitude: 39.9163,
    longitude: 116.3972,
    bortlescale: 8,
    description: "The imperial palace complex at the heart of Beijing that was home to Chinese emperors for nearly 500 years.",
    spot_type: "obscura"
  },
  {
    name: "Jiuzhaigou Valley",
    latitude: 33.2600,
    longitude: 103.9200,
    bortlescale: 3,
    description: "A nature reserve known for its spectacular multi-level waterfalls, colorful lakes, and pristine wilderness in Sichuan, China.",
    spot_type: "obscura"
  },
  {
    name: "Park Street Station Mural",
    latitude: 42.3564,
    longitude: -71.0625,
    bortlescale: 8,
    description: "An elaborate ceramic tile mural depicting Boston history hidden in a busy subway station in Massachusetts.",
    spot_type: "obscura"
  },
  {
    name: "Willie the Whale",
    latitude: 40.4850,
    longitude: -86.1390,
    bortlescale: 6,
    description: "A massive fiberglass whale sculpture that has become a beloved roadside attraction in Lafayette, Indiana.",
    spot_type: "obscura"
  },
  {
    name: "Hope Mill Conservation Area",
    latitude: 44.2841,
    longitude: -78.1740,
    bortlescale: 4,
    description: "Remnants of a historic 19th-century mill surrounded by tranquil nature trails in Ontario, Canada.",
    spot_type: "obscura"
  },
  {
    name: "Project Chimps",
    latitude: 34.9232,
    longitude: -84.2285,
    bortlescale: 4,
    description: "A sanctuary providing lifetime care for chimpanzees retired from research in Georgia's Blue Ridge Mountains.",
    spot_type: "obscura"
  },
  {
    name: "Withy Grove Stores",
    latitude: 53.4847,
    longitude: -2.2404,
    bortlescale: 7,
    description: "A historic Victorian warehouse complex in Manchester, England, now transformed into a modern shopping center.",
    spot_type: "obscura"
  },
  {
    name: "Turtle Cannery Museum",
    latitude: 24.5619,
    longitude: -81.8008,
    bortlescale: 6,
    description: "A museum dedicated to Key West's peculiar history of canning sea turtles in the Florida Keys.",
    spot_type: "obscura"
  },
  {
    name: "Seaboard Air Line Railroad Turntable",
    latitude: 35.7874,
    longitude: -78.6418,
    bortlescale: 7,
    description: "A historic railroad turntable and roundhouse that once served steam locomotives in Raleigh, North Carolina.",
    spot_type: "obscura"
  },
  {
    name: "Carhenge",
    latitude: 42.6042,
    longitude: -103.7469,
    bortlescale: 2,
    description: "A replica of England's Stonehenge made from vintage American automobiles in Alliance, Nebraska.",
    spot_type: "obscura"
  },
  {
    name: "The Wave",
    latitude: 36.9959,
    longitude: -112.0062,
    bortlescale: 1,
    description: "Spectacular sandstone rock formations with undulating shapes and vivid colors in Arizona's Coyote Buttes.",
    spot_type: "obscura"
  },
  {
    name: "Antelope Canyon",
    latitude: 36.8619,
    longitude: -111.3743,
    bortlescale: 2,
    description: "Stunning slot canyon with narrow passageways and light beams filtering through cracks in the Arizona desert.",
    spot_type: "obscura"
  },
  {
    name: "Door to Hell",
    latitude: 40.2530,
    longitude: 58.4397,
    bortlescale: 1,
    description: "A natural gas crater that has been burning continuously since 1971 in Turkmenistan's Karakum Desert.",
    spot_type: "obscura"
  },
  {
    name: "Fingal's Cave",
    latitude: 56.4326,
    longitude: -6.3369,
    bortlescale: 2,
    description: "A sea cave on the uninhabited island of Staffa in Scotland known for its hexagonal basalt columns.",
    spot_type: "obscura"
  },
  {
    name: "Mount Roraima",
    latitude: 5.1433,
    longitude: -60.7625,
    bortlescale: 1,
    description: "A tabletop mountain with sheer cliffs on all sides located at the junction of Brazil, Venezuela, and Guyana.",
    spot_type: "obscura"
  },
  {
    name: "Salar de Uyuni",
    latitude: -20.3078,
    longitude: -66.8250,
    bortlescale: 1,
    description: "The world's largest salt flat, creating mirror-like reflections during rainy season in Bolivia.",
    spot_type: "obscura"
  },
  {
    name: "Stone Forest",
    latitude: 24.8142,
    longitude: 103.2717,
    bortlescale: 5,
    description: "A remarkable set of limestone formations resembling petrified trees in Yunnan Province, China.",
    spot_type: "obscura"
  },
  {
    name: "Glowworm Caves",
    latitude: -38.2611,
    longitude: 175.1031,
    bortlescale: 1,
    description: "Underground caves illuminated by thousands of bioluminescent glowworms in Waitomo, New Zealand.",
    spot_type: "obscura"
  },
  {
    name: "Giant's Causeway",
    latitude: 55.2408,
    longitude: -6.5116,
    bortlescale: 3,
    description: "An area of about 40,000 interlocking basalt columns resulting from ancient volcanic activity in Northern Ireland.",
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
