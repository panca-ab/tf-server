import type { VercelRequest, VercelResponse } from '@vercel/node'
import loadModel from './model';
export const maxDuration = 60;

const modelPromise = loadModel();
// This variable stores the menu description embeddings so that it will load only once and reused on each search call
let descriptionsEmbeddings: any

type Item = {
  id: number
  className: string
  description: string
  similarity?: number
}

const items: Item[] = [
  {
    id: 1,
    className: "food",
    description:
      "Culinary arts and gastronomy encompass the art and science of food preparation and consumption. Chefs around the world combine creativity with technical skill to create dishes that delight the senses and reflect cultural traditions. Gastronomy explores the cultural, historical, and social aspects of food, emphasizing its role in identity and community. From haute cuisine to street food, culinary arts celebrate diversity and innovation, fostering appreciation for flavors, techniques, and culinary traditions across different regions and societies.",
  },
  {
    id: 2,
    className: "fashion",
    description:
      "Fashion design intersects with sustainability as designers and brands increasingly adopt eco-friendly practices to minimize environmental impact throughout the garment lifecycle. Sustainable fashion promotes ethical sourcing of materials, fair labor practices, and reducing waste through innovative design and recycling initiatives. Designers are exploring organic fabrics, upcycling vintage garments, and implementing circular fashion models to create stylish, durable clothing while addressing global concerns about resource depletion and pollution in the fashion industry.",
  },
  {
    id: 3,
    className: "psychology",
    description:
      "The psychology of emotions explores how individuals experience, express, and regulate emotions, influencing mental health and well-being. Research in psychology examines emotional intelligence, resilience, and the impact of social and cultural factors on emotional development. Therapeutic approaches such as cognitive-behavioral therapy (CBT) and mindfulness techniques help individuals manage emotions effectively and cope with stressors. Understanding emotions is crucial for promoting mental health awareness, fostering empathy, and improving interpersonal relationships in diverse contexts.",
  },
  {
    id: 4,
    className: "environment",
    description:
      "Environmental conservation focuses on preserving natural habitats, protecting endangered species, and promoting biodiversity to sustain ecosystems and ecosystem services. Conservation efforts involve habitat restoration, wildlife conservation initiatives, and sustainable land management practices to mitigate human impacts such as deforestation, pollution, and climate change. Conservation biologists study biodiversity patterns and ecological interactions to inform conservation strategies and policy decisions aimed at safeguarding biodiversity for future generations and maintaining the health of the planet.",
  },
]

async function initialize() {
  const model = await modelPromise;
  if (!descriptionsEmbeddings && model) {
    descriptionsEmbeddings = await model.embed(items.map((item) => item.description));
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Max-Age', '86400'); // 1 day
    return res.status(200).end();
  }

  // Handle actual request
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'POST') {
    const { keyword = '' } = req.body;
    let results: Item[] = []

    try {
      initialize()
      const model = await modelPromise; // Use the cached model

      if (keyword.trim().length <= 3 || !model) {
        results = items
      } else {
        const keywordEmbedding = await model.embed([keyword])

        // Calculate cosine similarity
        const similarities = descriptionsEmbeddings
          .matMul(keywordEmbedding.transpose())
          .arraySync() as number[]

        // Rank items based on similarity
        const rankedItems = items
          .map((item, index) => ({ item, similarity: similarities[index] }))
          .sort((a, b) => b.similarity - a.similarity)

        results = rankedItems.map((rankedItem) => ({
          ...rankedItem.item,
          similarity: rankedItem.similarity,
        })
        )
      }

      return res.json({
        results
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error generating embeddings', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}