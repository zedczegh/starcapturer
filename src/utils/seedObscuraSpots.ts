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
