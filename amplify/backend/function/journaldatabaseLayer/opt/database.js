const AWS = require('aws-sdk');
const { ulid } = require('ulid')

AWS.config.update({ region: "ca-central-1" })

const dynamodb = new AWS.DynamoDB.DocumentClient();

const tableName = "journalDB-dev";
const invertedIndex = 'invertedIndex';
const partitionKeyName = "PK";
const sortKeyName = "SK";




async function createUser(username) {
    var d = new Date()
    let params = {
        TableName: tableName,
        Item: {
            PK: "USER#" + username,
            SK: "USER#" + username,
            username: username,
            created: new Date(d.setHours(d.getHours() - 7)).toISOString()
        },
        ConditionExpression: "attribute_not_exists(PK)"
    }
    const result = await dynamodb.put(params).promise()
    console.log(result)
    return result
}

exports.createUser = createUser


async function createPost(username, description, imageName) {
    console.log("IN CREATE POST IN DB")
    const Item = {
      PK: "USER#" + username,
      SK: "POST#" + ulid(),
      username,
      description,
      imageName,
      created: new Date().toISOString(),
      postCount: 0,
      bucketList: false
    }

    let createParams = {
      TableName: tableName,
      Item: Item
    }

    let updateParams = {
      TableName: tableName,
      Key: {
        PK: "USER#" + username,
        SK: "USER#" + username,
      },
      UpdateExpression: "SET postCount = postCount+ :inc",
      ExpressionAttributeValues: {
        ":inc": 1
      }
    }

    await dynamodb.put(createParams).promise()
    await dynamodb.update(updateParams).promise()

    return Item
  }
  exports.createPost = createPost


async function getPost(username, postId) {
    let params = {
      TableName: tableName,
      Key: {
        PK: "USER#" + username,
        SK: "POST#" + postId
      }
    }

    const result = await dynamodb.get(params).promise()
    return result
  }
exports.getPost = getPost

async function getPosts(username) {
    let params = {
      TableName: tableName,
      KeyConditions: {
        PK: {
          ComparisonOperator: 'EQ',
          AttributeValueList: ["USER#" + username]
        },
        SK: {
          ComparisonOperator: 'BEGINS_WITH', // [IN, NULL, BETWEEN, LT, NOT_CONTAINS, EQ, GT, NOT_NULL, NE, LE, BEGINS_WITH, GE, CONTAINS]
          AttributeValueList: ["POST#"]
        }
      },
      ScanIndexForward: false
    }

    const result = await dynamodb.query(params).promise()
    return result
  }
exports.getPosts = getPosts


async function updatePost(username, postId, newDescription) {
    let params = {
      TableName: tableName,
      Key: {
        PK: "USER#" + username,
        SK: "POST#" + postId
      },

      UpdateExpression: "SET description = :newDescription",
      ExpressionAttributeValues: {
        ":newDescription": newDescription
      },
      ReturnValues: "UPDATED_NEW"
    }
    const result = await dynamodb.update(params).promise()
    console.log(result)
    return result
  }
exports.updatePost = updatePost



async function deletePost(username, postId) {
    let params = {
      TableName: tableName,
      Key: {
        PK: "USER#" + username,
        SK: "POST#" + postId
      }
    }
    let updateParams = {
      TableName: tableName,
      Key: {
        PK: "USER#" + username,
        SK: "USER#" + username,
      },
        UpdateExpression: "SET postCount = postCount- :inc",
        ExpressionAttributeValues: {
            ":inc": 1
        }

    }
    const result = await dynamodb.delete(params).promise()
    await dynamodb.update(updateParams).promise()
    return result
  }
exports.deletePost = deletePost


async function addPostToBucketList (username, postId) {
    let params = {
        TableName: tableName,
        Key: {
            PK: "USER#" + username,
            SK: "POST#" + postId
        },
        UpdateExpression: "SET bucketList = :bucketList",
        ExpressionAttributeValues: {
            ":bucketList": true
        },
        ReturnValues: "UPDATED_NEW"
    }
    const result = await dynamodb.update(params).promise()
    return result
}

exports.addPostToBucketList = addPostToBucketList


async function removePostFromBucketList (username, postId) {
    let params = {
        TableName: tableName,
        Key: {
            PK: "USER#" + username,
            SK: "POST#" + postId
        },
        UpdateExpression: "SET bucketList = :bucketList",
        ExpressionAttributeValues: {
            ":bucketList": false
        },
        ReturnValues: "UPDATED_NEW"
    }
    const result = await dynamodb.update(params).promise()
    return result
}

exports. removePostFromBucketList = removePostFromBucketList


async function getUser(username) {
    let params = {
      TableName: table,
      KeyConditions: {
        PK: {
          ComparisonOperator: 'EQ',
          AttributeValueList: ["USER#" + username]
        },
        SK: {
          ComparisonOperator: 'EQ',
          AttributeValueList: ["USER#" + username]
        }
      }
    }
    const result = await docClient.query(params).promise()
    console.log(result)
  }
exports.getUser = getUser



async function getBucketListPosts(username) {
    let params = {
      TableName: tableName,
      KeyConditions: {
        PK: {
          ComparisonOperator: 'EQ',
          AttributeValueList: ["USER#" + username]
        },
        SK: {
          ComparisonOperator: 'BEGINS_WITH', // [IN, NULL, BETWEEN, LT, NOT_CONTAINS, EQ, GT, NOT_NULL, NE, LE, BEGINS_WITH, GE, CONTAINS]
          AttributeValueList: ["POST#"]
        }
      },
      FilterExpression: "bucketList = :bucketList",
      ExpressionAttributeValues: {
        ":bucketList": true
      },
      ScanIndexForward: false
    }
    const result = await dynamodb.query(params).promise()
    return result
}

exports.getBucketListPosts = getBucketListPosts