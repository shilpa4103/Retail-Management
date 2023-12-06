import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql";
import cors from "cors"
import multer from "multer";
import path from 'path';
const PORT = process.env.PORT || 3001;

//route
const app = express();
app.use(express.json());

app.use(bodyParser.json());//else u get undefined for parsed values

app.use(express.static('public'))
//for http requests to work  cors:on server side  axios:on client side 
app.use(cors());
app.use(bodyParser.urlencoded({extended:true}));

var product_id=1;
var customer_email;

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
      cb(null,'public/images')
    },
    filename:(req,file,cb)=>{
      cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname))
    }
  })
  
  const upload=multer({
    storage:storage
  })
  

//to check if server is rendering message
app.get("/api", (req, res) => {
     return res.json({ message: "Hello  !" });
  });
  
 //connection to database
  var con=mysql.createConnection({
      host:'localhost',
      user:'root',
      password:'1234',
      port:'3306',
      database:'onlineretail'
  });

  //for admin to update price
  app.post('/updatePrice', async (req, res) => {
    var productId = req.body.pid;
    var newPrice = req.body.np;
    var oldPrice = req.body.op;
  
    console.log('Received request:', req.body);
  
    try {
      con.query('UPDATE newproduct SET new_price= ? ,old_price =? WHERE id = ?', [newPrice,oldPrice, productId], (error, results) => {
        if (error) {
          console.error('Error updating price:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          console.log('Price updated successfully:', results);
          res.json({ message: 'Price updated successfully', affectedRows: results.affectedRows });
        }
      });
    } catch (error) {
      console.error('Error updating price:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  app.post("/signup",(req,res)=>{
      var bpfname=req.body["firstname"];  
      var bplname=req.body["lastname"];    
      var bpemail=req.body["email"];
      var bpphno=req.body["phno"];
      var bppwd=req.body["password"];
      
      con.query('Select email from signup where email=?',[bpemail],function(err,result){
          if(err) {throw err;}
          else{
              console.log(result);
              if(result.length>0){
                  res.send("user with same email id exists");
              }else{
                  con.query('INSERT INTO signup(firstname,lastname,email,phno,password) VALUES (?,?,?,?,?)',[bpfname,bplname,bpemail,bpphno,bppwd],function(err,result){
                      if(err) {throw err;}
                      else{res.send("User successfully registered")
                      customer_email=bpemail;
                    }
                      console.log("record inserted");
                  });
              }
          }
      })
     
  });
  
  app.post("/login",async(req,res)=>{
      var bpemail=req.body.useremail;
      var bpupwd=req.body["userpassword"];
      console.log(bpemail);
          con.query('select email from signup where email =? ',[bpemail],function(error,result){
          if(error) {throw error;}
          else{
              console.log(result);
              if(result.length>0){
                  
                  con.query('select password from signup where email=? and password=?',[bpemail,bpupwd],function(error,result){
                      if(error){throw error;}
                      else{
                          
                          if(result.length>0){
                             customer_email=bpemail;
                              res.json("Success");
                          }else{
                              res.send("Incorrect Password");
                          }
                      }
                  });
              }else{
                  res.send("Incorrect email id");
              }
          }
          
      });
  });

  app.post("/new_product",async(req,res)=>{
    var pid=req.body["product_id"];  
    var pname=req.body["product_name"];    
    var pcategory=req.body["product_category"];
    var poldp=req.body["product_oldprice"];
    var pnewp=req.body["product_newprice"];
  
console.log(pid);
    con.query('INSERT INTO newproduct (id,name,category,new_price,old_price) VALUES (?,?,?,?,?)',[pid,pname,pcategory,pnewp,poldp],function(err,result){
     if(err) {throw err;}
     else{res.send("product inserted")}
    console.log(result);
            
            
        
    })
   
});

console.log(product_id);
  
  con.connect(function(err){
      if(err) throw err;
        console.log("Connected to database");
      var sql="select * from customer";
      con.query(sql,function(err,result,fields){
          if(err) throw err;
          console.log(result);
      });
       
  });

  

  app.post('/upload', upload.single('image'),async(req, res) =>{
    const image=req.file.filename;
    const productID=req.body.product_id
  
    console.log(image)
    const sql="UPDATE newproduct set imgname=? where id=?";
   con.query(sql,[image,productID],(err,result)=>{
      if(err) return res.json({message:"Error"});
      return res.json({Status:"Success"});
})
})

app.get('/fetchimages',(req,res)=>{
  const sql='select * from newproduct';
  con.query(sql,(err,result)=>{
    if(err) return res.json("error");
    else{
    return res.json(result);}
  })
})

app.post('/add_to_cart', (req, res) => {
  const  {product_Id} = req.body;
console.log(product_Id);
  console.log(customer_email);
      // Customer exists, add item to their cart
      con.query('INSERT INTO cartItems (cust_email, product_id) VALUES (?, ?)', [customer_email, product_Id], (err) => {
        if (err) {
          console.error('Error adding item to cart:', err);
          res.status(500).send('Internal Server Error');
        } else {
          res.status(200).send('Item added to cart');
        }
      });
});

app.get('/get_cart_items', (req, res) => {
  

  con.query('SELECT * FROM (cartItems join newproduct on cartItems.product_id=newproduct.id)  WHERE cust_email = ?', [customer_email], (err, results) => {
    if (err) {
      console.error('Error fetching cart items:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(results);
    }
  });
});


  
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});