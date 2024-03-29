import connectDB from '../../../utils/connectDB'
import Sites from '../../../models/siteModel'
import auth from '../../../middleware/auth'

connectDB()

export default async (req, res) => {
    switch(req.method){
        case "GET":
            await getSites(req, res)
            break;
        case "POST":
            await createSite(req, res)
            break;
    }
}

class APIfeatures {
    constructor(query, queryString){
        this.query = query;
        this.queryString = queryString;
    }
    filtering(){
        const queryObj = {...this.queryString}

        const excludeFields = ['page', 'sort', 'limit']
        excludeFields.forEach(el => delete(queryObj[el]))
          
        if(queryObj.title !== 'all')
            this.query.find({title: {$regex: queryObj.title}})
            
        this.query.find()
        return this;
    }

    sorting(){
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join('')
            this.query = this.query.sort(sortBy)
        }else{
            this.query = this.query.sort('-createdAt')
        }

        return this;
    }

    paginating(){
        const page = this.queryString.page * 1 || 1
        const limit = this.queryString.limit * 1 || 1
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit)
        return this;
    }
}

const getSites = async (req, res) => {
    try {
        const features = new APIfeatures(Sites.find(), req.query)
        .filtering().sorting().paginating()

        const sites = await features.query
        
        res.json({
            status: 'success',
            result: sites.length,
            sites
        })
    } catch (err) {
        return res.status(500).json({err: err.message})
    }
}

const createSite = async (req, res) => {
    try {
        const result = await auth(req, res)
        if(result.role !== 'admin') return res.status(400).json({err: 'Authentication is not valid.'})

        const {
            title, 
            about, 
            phone, 
            email, 
            facebook, 
            whatsapp, 
            twitter, 
            instagram, 
            images, 
            terms_conditions, 
            privacy_policy       
        } = req.body

        if(!title || !about || !phone || !email || !terms_conditions || !privacy_policy  || images.length === 0)
        return res.status(400).json({err: 'Please add all the fields.'})


        const newSite = new Sites({
            title, 
            about, 
            phone, 
            email, 
            facebook, 
            whatsapp, 
            twitter, 
            instagram, 
            images, 
            terms_conditions, 
            privacy_policy 
        })

        await newSite.save()

        res.json({msg: 'Success! Created a new site'})

    } catch (err) {
        return res.status(500).json({err: err.message})
    }
}