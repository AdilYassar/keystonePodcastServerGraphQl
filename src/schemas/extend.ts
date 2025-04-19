import { mergeSchemas } from "@graphql-tools/schema";
import axios from "axios";
import {gql} from "graphql-tag";




const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const API_KEY = process.env.GEMINI_API_KEY;



export const extendGraphqlSchema = (schema:any) => mergeSchemas({
    schemas:[schema],
    typeDefs:gql`
    type RegisterResponse{
    user:User
    
    }
    type PodcastRecommendation {
    id:ID!
    title:String!
    category:String!
    video_uri:String
    artwork:String
    audio_uri:String
    lyricist:String
    type:String!
    artist:ArtistInfo
    isFavourite:Boolean!

    }

    type ArtistInfo {
    id:ID!
    name:String!
    bio:String
    photo:String
    }

    extend type Mutation {
 registerUser(
  name: String!
  email: String!
  password: String!
): RegisterResponse
    }


 extend type Query {
  getRecommendedPodcasts(userId: ID!): [PodcastRecommendation]
}

    `,
    resolvers:{

        Mutation:{
            registerUser: async (root:any, {name,email,password}, context:any) => {
                const existingUser = await context.db.User.findOne({
                    where:{email}
                })
                if(existingUser){
                    throw new Error("User already exists")
                }
                const newUser = await context.db.User.createOne({
                    data:{
                        name,
                        email,
                        password,
                    }
                })
                return {user:newUser}

            }
        },
        Query:{
            getRecommendedPodcasts:async (_, {userId}, context) =>{
                try {
                    const user = await context.db.User.findOne({
                        where:{id:userId},
                        query:`
                        id
                        favouritePodcasts{ id title category}
                        `
                    })
                    if(!user){
                        throw new Error("User not found")
                    }
                    const favouritePodcasts = user.favouritePodcasts || [];
                    const favouriteCategories = [
                        ...new Set(favouritePodcasts.map((podcast:any) => podcast.category)),

                    ];
                    const allPodcasts = await context.db.Podcast.findMany({
                        query:`
                        id
                        title
                        category
                        video_uri
                        artwork
                        audio_uri
                        lyricist
                        type
                        artist{ id 
                        name
                         bio
                          photo
                          }
                        `,
                     
                    })
                    const favouritePodcastIds = favouritePodcasts.map((podcast:any) => podcast.id);
                    const availablePodcasts = allPodcasts.filter(
                        (podcast:any) => !favouritePodcastIds.includes(podcast.id)
                    )
                    if(availablePodcasts.length === 0){
                        return []
                    }


                    const Prompt = `
                 You are a podcast recommendation engine.
                Based on the user's favourite podcasts, recommend 5 new podcasts.
                 The user likes podcasts in the following categories: ${
                favouriteCategories.length 
                ? favouriteCategories.join(", ") 
                : "none"
                }.
                From the following available podcasts, recommend 5 that the user might like:
                ${availablePodcasts
                .map(
                  (podcast: any) => `${podcast.title} (Category: ${podcast.category}, Artist: ${podcast?.artist?.name})`
                )
                .join("\n")}.
                
                Return only the titles in this JSON format:
                {
                recommendations: ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]
                }


`;


                const response = await axios.post(
                    `${GEMINI_API_URL}?key=${API_KEY}`,
                    {
                        contents: [
                            {
                                parts:[{text:Prompt}]
                            },
                        ],

                    },
                    {
                        headers:{
                            "Content-Type":"application/json",
                        },
                    }
                );

                const aiResponse = 
                response.data.candidates?.[0]?.parts?.[0]?.text || "{}";

                const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || [null, aiResponse];
                if(!jsonMatch){
                    throw new Error("Invalid response format from AI model");
                }

                const jsonString = jsonMatch[1];
                const {recommendations} = JSON.parse(jsonString);
                if(!Array.isArray(recommendations)){
                    throw new Error("Invalid recommendations/response format");
                }
                const matchedPodcasts = allPodcasts.filter((podcast:any) =>
                    recommendations.includes(podcast.title))
                const podcastWithArtist = matchedPodcasts?.map((podcast:any) => {
                    return {
                        ...podcast,
                        artist:{
                            bio:" Ai generated bio",
                            id:124,
                            name:"Ai generated name",
                            photo:"Ai generated photo",
                        }
                    };
                })
                return podcastWithArtist;


 
                } catch (error) {
                    console.error("Error fetching recommended podcasts:", error);
                    throw new Error("Failed to fetch recommended podcasts");

                }

            } 
        }

    }
})