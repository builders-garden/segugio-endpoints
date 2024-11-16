import type { Request, Response } from "express";
import { Logger } from "../../utils/logger.js";
import { createAddAddressQuickNode } from "../../utils/schemas/quicknode.schema.js";
import { QuickNodeNotification } from "../../utils/types.js";
import { env } from "../../env.js";

const logger = new Logger("testHandler");

const QUICKNODE_API_KEY = env.QUICKNODE_API_KEY
const QUICKNODE_NOTIFICATION_ID = env.QUICKNODE_NOTIFICATION_ID

async function getNotification() {
  var myHeaders = new Headers()
  myHeaders.append('accept', 'application/json')
  myHeaders.append('x-api-key', QUICKNODE_API_KEY)

  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow' as RequestRedirect
  }

  try {
    let response = await fetch(
      `https://api.quicknode.com/quickalerts/rest/v1/notifications/${QUICKNODE_NOTIFICATION_ID}`,
      requestOptions
    )
    let result = await response.text()
    return JSON.parse(result) as QuickNodeNotification
  } catch (err) {
    console.error(err)
    return undefined
  }
}

export async function addAddressToScan(req: Request, res: Response) {
  logger.log("Adding Address to QuickNode webhook...");
  const parsedBody = createAddAddressQuickNode.safeParse(req.body);

  if (!parsedBody.success) {
    logger.error(`Error ${JSON.stringify(parsedBody.error.errors)}`);
    res.status(400).json({ error: parsedBody.error.errors });
  } else {
    logger.log(`Successfully parsed body ${JSON.stringify(parsedBody.data)}`);

    let notification = await getNotification()

    if (!notification) {
      res.status(500).json({ error: 'Error getting notification' })
      return
    }

    const newExpression = `${notification.expression} && ((tx_to == '${parsedBody.data.address}') || (tx_from == '${parsedBody.data.address}'))`
    const encodedNewExpression = Buffer.from(newExpression).toString('base64')

    var myHeaders = new Headers()
    myHeaders.append('accept', 'application/json')
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('x-api-key', QUICKNODE_API_KEY)

    var requestOptions = {
      method: 'PATCH',
      headers: myHeaders,
      redirect: 'follow' as RequestRedirect,
      body: JSON.stringify({
        expression: encodedNewExpression,
      }),
    }

    try {
      let response = await fetch(
        `https://api.quicknode.com/quickalerts/rest/v1/notifications/${QUICKNODE_NOTIFICATION_ID}`,
        requestOptions
      )
      let result = await response.text()
      console.log(result)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error updating notification' })
    }

    res.status(200).json({
      address: parsedBody.data.address,
      message: `Successfully addedd address to QuickNode for ${parsedBody.data.address}`,
    });
  }
}
