import { withAuth , session} from "./auth";
import { config } from "@keystone-6/core";
import { User } from "./src/schemas/users";


export default withAuth(

    config({
        db:{
            provider:"sqlite",
            url:"file:./db.sqlite",


        },
        lists:{ User},
        session,
        ui:{
           isAccessAllowed:({session})=>{
                return !!session?.data?.isAdmin;

            }
           }
        },
    
    )
)
