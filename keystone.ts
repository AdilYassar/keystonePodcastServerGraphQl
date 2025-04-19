import { withAuth , session} from "./auth";
import { config, graphql } from "@keystone-6/core";
import { User } from "./src/schemas/users";
import { Artist } from "./src/schemas/artist";
import { Podcast } from "./src/schemas/podcast";
import { extendGraphqlSchema } from "./src/schemas/extend";


export default withAuth(

    config({
        db:{
            provider:"sqlite",
            url:"file:./db.sqlite",


        },
        lists:{ User, Artist, Podcast},
        session,
        ui:{
           isAccessAllowed:({session})=>{
                return !!session?.data?.isAdmin;

            }
           },
           graphql:{
            extendGraphqlSchema:extendGraphqlSchema,
           }
          
        })
)
