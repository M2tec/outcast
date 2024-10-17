localStorage.clear()

let coverImageDataBase64 = "";
let songDataBase64 = "";

let releaseNameInput = document.getElementById('releaseName');


let coverImageInput = document.getElementById("coverImage");
let songDataInput = document.getElementById("songData");
let fileList = [];

let distributorInput = document.getElementById('distributor');

let amountInput = document.getElementById('amountInput');
let walletAddressInput = document.getElementById('walletInput');

let radioButton = document.getElementById("network_preprod");
radioButton.checked = true;

let actionBtn = document.getElementById("connectBtn");

let amountAlert = document.getElementById('amountAlert');
let txAlertText = document.getElementById("txAlertText");
let txSuccessAlert = document.getElementById("txSuccessAlert");


function readCoverFile(file) {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const result = event.target.result;
      console.log(result)
      coverImageDataBase64 = gc.utils.Buffer.from(result).toString("hex")
    });
  
    reader.addEventListener('progress', (event) => {
      if (event.loaded && event.total) {
        const percent = (event.loaded / event.total) * 100;
        console.log(`Progress: ${Math.round(percent)}`);
      }
    });
    reader.readAsDataURL(file);
  }
  
  function readSongFile(file) {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const result = event.target.result;
      console.log(result)
      coverSongDataBase64 = gc.utils.Buffer.from(result).toString("hex")
    });
  
    reader.addEventListener('progress', (event) => {
      if (event.loaded && event.total) {
        const percent = (event.loaded / event.total) * 100;
        console.log(`Progress: ${Math.round(percent)}`);
      }
    });
    reader.readAsDataURL(file);
  }

async function main() {
    const gc = window.gc

    async function setData() {

        // Get Data from UI
        let resultObj = undefined;
        let error = "";
        let releaseName = "";
        let distributor = "";
        error = "";

        amount = parseFloat(amountInput.value) * 1000000;

        if (isNaN(amount)) {
            amountAlert.style.display = "block"
            actionBtn.classList.add("disabled");
            return
        } else {
            amountAlert.style.display = "none"
            actionBtn.classList.remove("disabled");
        }

        releaseName = releaseNameInput.value;
        console.log(releaseName)

        coverFileList = coverImageInput.files; /* now you can work with the file list */
        console.log(coverFileList.length)
        if (coverFileList.length > 0) {

            coverFile = coverFileList[0]
            console.log(coverFileList);
            console.log(coverFile.name);
            readCoverFile(coverFile)
            // console.log(data);
            // coverImageDataBase64 = gc.utils.Buffer.from(data).toString("hex")
        }

        songFileList = songDataInput.files; /* now you can work with the file list */
        console.log(songFileList.length)
        if (coverFileList.length > 0) {
            console.log(songFileList);
            songFile = songFileList[0];
            console.log(songFile.name);
            readSongFile(songFile)
        }

        distributor = distributorInput.value;

        walletAddress = walletAddressInput.value;

        let network_type = document.querySelector("input[type='radio'][name=network_type]:checked").value;
        console.log("Net:" + network_type)
        
        // Set Data from UI

        //GameChanger Wallet support arbitrary data returning from script execution, encoded in a redirect URL
        //Head to https://beta-preprod-wallet.gamechanger.finance/doc/api/v2/api.html#returnURLPattern to learn ways how to customize this URL

        //lets try to capture the execution results by decoding/decompressing the return URL
        let currentUrl = window.location.href;
        try {
            let resultRaw = (new URL(currentUrl)).searchParams.get("result");
            if (resultRaw) {
                resultObj = await gcDecoder(resultRaw);
                //avoids current url carrying latest results all the time 
                history.pushState({}, '', window.location.pathname);
            }
        } catch (err) {
            error += `Failed to decode results.${err?.message || "unknown error"}`;
            console.error(err);
        }

        // let gcscript =
        // {
        //     "title": "Single publis",
        //     "description": "Publish a song on the Cardano blockchain using the CIP-60 standard",
        //     "type": "script",
        //     "run": {
        //         "importedScript": {
        //             "type": "importAsScript",
        //             "args": {
        //                 "title": "Write song to chain (built by M2tec)",
        //                 "releaseName": releaseName,
        //                 "distributor": distributor,
        //                 "address": walletAddress,
        //                 "amount": amount.toString(),
        //                 "url": "https://outcast.m2tec.nl/?txHash={txHash}",
        //                 "msg": txInfo
        //             },                    
        //             "from": [
        //                 "gcfs://386bec6c6199a40890abd7604b60bf43089d9fb1120a3d42198946b9.Lib@latest://pay.gcscript"
        //             ]
        //         }
        //     }
        // }
        let gcscript =
        {
            "title": "Publish single",
            "description": "Publish a song on the Cardano blockchain using the CIP-60 standard",
            "type": "script",
            "args": {
                "title": "Write song to chain (built by M2tec)",
                "releaseName": releaseName,
                "coverImageDataHex": coverImageDataBase64,
                "songDataHex": songDataBase64,
                "distributor": distributor,
                "address": walletAddress,
                "amount": amount.toString(),
                "url": "https://outcast.m2tec.nl/?txHash={txHash}",
            },  
            "run": {
                "songId": {
                    "type": "macro",
                    "run": "{truncate(uuid(),0,12,'')}"
                  },
                "fs": {
                    "type": "macro",
                    "run": [
                      {
                        "{replaceAll('//SONG_ID.cover.jpg','SONG_ID',get('cache.songId'))}": {
                          "kind": "file",
                          "fileHex": "{get('args.coverImageDataHex')}"
                        }
                      },
                      {
                        "{replaceAll('//SONG_ID.song.mp3','SONG_ID',get('cache.songId'))}": {
                          "kind": "file",
                          "fileHex": "{get('args.songDataHex')}"
                        }
                      }
                    ]
                  },
                  "buildTxs": {
                    "type": "buildFsTxs",
                    "description": "Outcast permapublish",
                    "assetName": "outcast",
                    "replicas": "1",
                    "layers": "{get('cache.fs')}"
                  },
                  "signTxs": {
                    "detailedPermissions": false,
                    "type": "signTxs",
                    "namePattern": "GCFS_Signed_{key}",
                    "txs": "{get('cache.buildTxs.txList')}"
                  },
                  "submitTxs": {
                    "type": "submitTxs",
                    "mode": "parallel",
                    "namePattern": "GCFS_Submitted{key}",
                    "txs": "{get('cache.signTxs')}"
                  },
                  "finally": {
                    "type": "script",
                    "exportAs": "buildFs",
                    "run": {
                      "txs": {
                        "type": "macro",
                        "run": "{get('cache.submitTxs')}"
                      }
                    }
                  }
            }
        }

        console.log(gcscript)
        gcscript.returnURLPattern = window.location.origin + window.location.pathname;

        const actionUrl = await gc.encode.url({
            input: JSON.stringify(gcscript),
            apiVersion: '2',
            network: network_type
        })

        console.log(actionUrl)

        let none_style = `{
            "logo": "",
            "title": "",
            "subTitle": "",
            "colorDark": "#000000",
            "colorLight": "#ffffff",
            "quietZone": 0        
            }`

        // const qr = await gc.encode.qr({
        //     input: JSON.stringify(gcscript),
        //     apiVersion: '2',
        //     network: network_type,
        //     qrResultType: 'png',
        //     styles: none_style,
        //     template: 'printable'
        // })

        // console.log(qr);
        // qrCodeImage.src = qr;

        if (actionUrl) {

            actionBtn.setAttribute("href", actionUrl)
            // document.getElementById("qrcode").innerHTML = "";

            // dAppLink.style.visibility = "visible";
            // dAppLink.href = actionUrl;

            // tweetButton = document.getElementById('tweetButton');
            // tweetButton.innerHTML = ''

            // twttr.widgets.createShareButton(
            //     '#GamechangerOk',
            //     document.getElementById('tweetButton'),
            //     {
            //         size: "large",
            //         text: actionUrl
            //     }
            // );

        } else {
            actionBtn.href = '#';
            actionBtn.innerHTML = "Loading...";
        }

        if (resultObj) {
            resultsBox.innerHTML = JSON.stringify(resultObj, null, 2);
        }

    }

    async function setTxResultAlert() {
        const searchParams = new URLSearchParams(window.location.search);

        for (const param of searchParams) {
            console.log(param);

            if (param[0] == "result") {
                console.log(param[1])
                let decoded = await gcDecoder(param[1], useCodec);
                let txHash = decoded.exports.data.txHash
                console.log(decoded.exports.data.txHash)
                txAlertText.innerHTML = 'Transaction successfull.   TxHash: ' + txHash
                txSuccessAlert.style.display = "block"
            }

            if (param[0] == "txHash") {
                console.log(param[1])
                let txHash = param[1]
                txAlertText.innerHTML = 'Transaction successfull.   TxHash: ' + txHash
                txSuccessAlert.style.display = "block"
            }

        }

    }
    setData();
    setTxResultAlert();
}

window.onload = function () {
    main();
}

document.addEventListener('DOMContentLoaded', () => {
    const interBubble = document.querySelector('.interactive');
    let curX = 0;
    let curY = 0;
    let tgX = 0;
    let tgY = 0;

    function move() {
        curX += (tgX - curX) / 20;
        curY += (tgY - curY) / 20;
        interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
        requestAnimationFrame(() => {
            move();
        });
    }

    window.addEventListener('mousemove', (event) => {
        tgX = event.clientX;
        tgY = event.clientY;
    });

    move();
});
