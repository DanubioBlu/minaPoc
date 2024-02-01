// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
}

export default async  function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {


  // MOCK data for avoid endpoit availability problem

  // const response = await fetch(
  //   'https://07-oracles.vercel.app/api/credit-score?user=3'
  // );

  var data={"data":{"id":1,"creditScore":787},"signature":"7mXGPCbSJUiYgZnGioezZm7GCy46CEUbgcCH9nrJYXQQiwwVrA5wemBX4T1XFHUw62oR2324QNnkUVXW6yYQLsPsqxZ3nsYR","publicKey":"B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy"};

  res.status(200).json(data);
}
