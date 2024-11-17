import type { Request, Response } from "express";
import { env } from "../../env.js";
import axios from "axios";
import { OneInchPnL, OneInchTokenData } from "../../utils/types.js";

const ONEINCH_BASE_URL = "https://api.1inch.dev";
const chainId = "8453";

export async function getMultiPortfolio(req: Request, res: Response) {
  const { addresses } = req.query;
  const url = `${ONEINCH_BASE_URL}/portfolio/portfolio/v4/overview/erc20/details`;

  const config = {
    headers: {
      Authorization: `Bearer ${env.ONEINCH_API_KEY}`,
    },
    params: {
      addresses: addresses,
      chain_id: chainId,
      timerange: "3years",
      closed: true,
      closed_threshold: 1,
    },
    paramsSerializer: {
      indexes: null,
    },
  };

  try {
    const response = await axios.get(url, config);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(response.data);

    res.status(200).json({
      status: "ok",
      data: {
        portfolios: response.data,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
}

export async function generalProfitAndLoss(req: Request, res: Response) {
  const { addresses } = req.query;
  const url = `${ONEINCH_BASE_URL}/portfolio/portfolio/v4/general/profit_and_loss`;

  const config = {
    headers: {
      Authorization: `Bearer ${env.ONEINCH_API_KEY}`,
    },
    params: {
      addresses: addresses,
      chain_id: chainId,
    },
    paramsSerializer: {
      indexes: null,
    },
  };

  try {
    const response = await axios.get(url, config);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    res.status(200).json({
      status: "ok",
      data: {
        profitAndLoss: response.data as OneInchPnL,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
}

export async function generalCurrentValue(req: Request, res: Response) {
  const { addresses } = req.query;

  const url = "https://api.1inch.dev/portfolio/portfolio/v4/general/current_value";

  const config = {
      headers: {
  "Authorization": `Bearer ${env.ONEINCH_API_KEY}`
},
      params: {
  "addresses": addresses,
  "chain_id": "8453"
},
      paramsSerializer: {
        indexes: null
      }
  };
  
  try {
    const response = await axios.get(url, config);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    res.status(200).json({
      status: "ok",
      data: {
        currentValue: response.data,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "nok",
      message: "Internal server error",
    });
  }
}

export async function getTokenDetails(req: Request, res: Response) {
  const { addresses } = req.query;
  const url = `${ONEINCH_BASE_URL}/portfolio/portfolio/v4/overview/erc20/details`;

  const config = {
    headers: {
      Authorization: `Bearer ${env.ONEINCH_API_KEY}`,
    },
    params: {
      addresses: addresses,
      chain_id: chainId,
      closed: true,
      closed_threshold: 1,
    },
    paramsSerializer: {
      indexes: null,
    },
  };

  try {
    const response = await axios.get(url, config);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    res.status(200).json({
      status: "ok",
      data: {
        tokenDetails: response.data,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "nok",
      message: "Internal server error",
    });
  }
}

export async function getTokensData(req: Request, res: Response) {
  const { addresses } = req.query;
  const url = `${ONEINCH_BASE_URL}/token/v1.2/8453/custom`;

  const config = {
    headers: {
      Authorization: `Bearer ${env.ONEINCH_API_KEY}`,
    },
    params: {
      addresses: addresses,
    },
    paramsSerializer: {
      indexes: null,
    },
  };

  try {
    const response = await axios.get(url, config);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    res.status(200).json({
      status: "ok",
      data: {
        tokensData: response.data as OneInchTokenData,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "nok",
      message: "Internal server error",
    });
  }
}
