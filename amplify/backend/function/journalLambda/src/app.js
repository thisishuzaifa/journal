/* Amplify Params - DO NOT EDIT
	AUTH_JOURNALE444174E_USERPOOLID
	ENV
	REGION
	STORAGE_JOURNALDB_ARN
	STORAGE_JOURNALDB_NAME
	STORAGE_JOURNALDB_STREAMARN
Amplify Params - DO NOT EDIT *//*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/


const AWS = require('aws-sdk');
const database = require('/opt/database.js');
const express = require('express')
const bodyParser = require('body-parser')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

// declare a new express app
const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});

//check user authentication
async function getAuthUser(req) {
  const authProvider = req.apiGateway.event.requestContext.identity.cognitoAuthenticationProvider
  if (!authProvider) {
    return
  }
  const parts = authProvider.split(':');
  const poolIdParts = parts[parts.length - 3];
  if (!poolIdParts) {
    return
  }
  const userPoolIdParts = poolIdParts.split('/');

  const userPoolId = userPoolIdParts[userPoolIdParts.length - 1];
  const userPoolUserId = parts[parts.length - 1];

  const cognito = new AWS.CognitoIdentityServiceProvider();
  const listUsersResponse = await cognito.listUsers({
    UserPoolId: userPoolId,
    Filter: `sub = "${userPoolUserId}"`,
    Limit: 1,
  }).promise();

  const user = listUsersResponse.Users[0];
  return user
}

// endpoints for posts
app.get('/posts', async (req, res) => {
  console.log("try to get posts")
  try {
    const authUser = await getAuthUser(req)
    let posts = await database.getPosts(authUser.Username)
    posts.Items = posts.Items.map(post => {
      return {
        ...post,
        id: post.SK.replace("POST#", "")
      }
    })
    res.send(posts)
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
});


app.post('/posts/create', async (req, res) => {
  const description = req.body.description
  const imageName = req.body.imageName
  try {
    const authUser = await getAuthUser(req)
    const result = await database.createPost(authUser.Username, description, imageName)
    result.id = result.SK.replace("POST#", "")
    res.send(result)
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
});


app.put('/posts/update/:id', async (req, res) => {
  const postId = req.params.id
  const description = req.body.description
  try {
    const authUser = await getAuthUser(req)
    const result = await database.updatePost(authUser.Username, postId, description)
    res.send(result)
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
});


app.delete('/posts/delete/:id', async function (req, res) {
  const postId = req.params.id;
  console.log("post id: " + postId)
  try {
    const authUser = await getAuthUser(req)
    const post = await database.getPost(authUser.Username, postId)
    console.log(post)
    if (Object.keys(post).length === 0) {
      res.status(403).send({ error: "Cannot delete" })
    } else {
      const result = await database.deletePost(authUser.Username, postId)
      console.log("Result: " + JSON.stringify(result))
      res.send({ message: "deleted successfully", postId: postId })
    }
  } catch (error) {
    console.log(error)
    res.status(500).send(error)
  }
});


// endpoints for bucket list

app.get('posts/bucketList', async (req, res) => {
  try {
    const authUser = await getAuthUser(req)
    const result = await database.getBucketListPosts(authUser.Username)
    res.send(result)
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
});


app.put('posts/bucketList/:id', async (req, res) => {
  const postId = req.params.id
  try {
    const authUser = await getAuthUser(req)
    const result = await database.addPostToBucketList(authUser.Username, postId)
    res.send(result)
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
});


app.delete('/posts/bucketList/:id', async function (req, res) {
  const postId = req.params.id;
  console.log("post id: " + postId)
  try {
    const authUser = await getAuthUser(req)
    const result = await database.removeFromBucketList(authUser.Username, postId)
    console.log("Result: " + JSON.stringify(result))
    res.send({ message: "deleted successfully", postId: postId })
  } catch (error) {
    console.log(error)
    res.status(500).send(error)
  }
});


app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
