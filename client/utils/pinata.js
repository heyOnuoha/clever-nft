
// const key = process.env.REACT_APP_PINATA_KEY
const key = '14d3901325090af410e1'
// const secret = process.env.REACT_APP_PINATA_SECRET
const secret = '3f5dddb18599469598e4df06eaac6dee757e54f59fce01f3b0a7dab443361dea'
import axios from 'axios'

export const pinFileToIPFS = async (file) => {

    let data = new FormData();
    data.append('file', file);
    console.log(file)
    console.log(process)
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    return axios
        .post(url, data, {
            headers: {
                pinata_api_key: key,
                pinata_secret_api_key: secret,
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
            }
        })
        .then(function (response) {
            
           return {
               success: true,
               pinataUrl: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash
           };
        })
        .catch(function (error) {
            console.log(error)
            return {
                success: false,
                message: error.message,
            }
        })
}

export const pinJSONToIPFS = async (JSONBody) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    return axios
        .post(url, JSONBody, {
            headers: {
                pinata_api_key: key,
                pinata_secret_api_key: secret,
            }
        })
        .then(function (response) {
           return {
               success: true,
               pinataUrl: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash
           }
        })
        .catch(function (error) {
            console.log(error)
            return {
                success: false,
                message: error.message
            }
           
        })
}