/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
 const database = require("/opt/database.js");

 exports.handler = async (event) => {
  const userName = event.userName
  console.log(userName)
  const databaseUser = await database.getUser(userName)
  console.log(databaseUser)
  if (!databaseUser) {
    const response = await database.createUser(userName)
    console.log(response)
  }

  return event
}
