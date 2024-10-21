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

function base64ToHex(str) {
  const raw = atob(str);
  let result = '';
  for (let i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16);
    result += (hex.length === 2 ? hex : '0' + hex);
  }
  return result;
}

// async function readCoverFile(file) {
//   const reader = new FileReader();
//   reader.addEventListener('load', (event) => {
//     const result = event.target.result;
//     console.log(result)
//     let data = result.slice(result.indexOf(",") + 1);
//     console.log(data)
//     // coverImageDataBase64 = gc.utils.Buffer.from(data).toString("hex");
//     coverImageDataBase64 = base64ToHex(data)
//     console.log(coverImageDataBase64);
//     main();
//   });

//   reader.addEventListener('progress', (event) => {
//     if (event.loaded && event.total) {
//       const percent = (event.loaded / event.total) * 100;
//       console.log(`Progress: ${Math.round(percent)}`);
//     }
//   });
//   reader.readAsDataURL(file);
// }

// async function readSongFile(file) {
//   const reader = new FileReader();
//   reader.addEventListener('load', (event) => {
//     const result = event.target.result;
//     console.log(result)
//     let data = result.slice(result.indexOf(",") + 1);
//     console.log(data)
//     // coverSongDataBase64 = gc.utils.Buffer.from(result).toString("hex")
//     songDataBase64 = base64ToHex(data)
//     console.log(songDataBase64);
//     main();

//   });

//   reader.addEventListener('progress', (event) => {
//     if (event.loaded && event.total) {
//       const percent = (event.loaded / event.total) * 100;
//       console.log(`Progress: ${Math.round(percent)}`);
//     }
//   });
//   reader.readAsDataURL(file);
// }

// async function coverDataChange() {
//   coverFileList = coverImageInput.files; /* now you can work with the file list */
//   console.log(coverFileList.length)
//   if (coverFileList.length > 0) {

//     coverFile = coverFileList[0]
//     console.log(coverFileList);
//     console.log(coverFile.name);
//     readCoverFile(coverFile)
//     // console.log(data);
//     // coverImageDataBase64 = gc.utils.Buffer.from(data).toString("hex")
//   }

// }

// async function songDataChange() {
//   songFileList = songDataInput.files; /* now you can work with the file list */
//   console.log(songFileList.length)
//   if (songFileList.length > 0) {
//     console.log(songFileList);
//     songFile = songFileList[0];
//     console.log(songFile.name);
//     readSongFile(songFile)
//   }

// }

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

    let gcscript =
    {
      "type": "script",
      "title": "Song CIP-60",
      "description": "Writing song data to the blockchain",
      "exportAs": "SongData",
      "return": {
          "mode": "last"
      },
      "run": {
          "dependencies": {
              "type": "script",
              "run": {
                  "address": {
                      "type": "getCurrentAddress"
                  },
                  "addressInfo": {
                      "type": "macro",
                      "run": "{getAddressInfo(get('cache.dependencies.address'))}"
                  },
                  "assetName": {
                      "type": "data",
                      "value": "Song CIP-60"
                  },
                  "quantity": {
                      "type": "data",
                      "value": "100"
                  },
                  "currentSlotNumber": {
                      "type": "getCurrentSlot"
                  },
                  "deadlineSlotNumber": {
                      "type": "macro",
                      "run": "{addBigNum(get('cache.dependencies.currentSlotNumber'),'86400')}"
                  },
                  "mintingPolicy": {
                      "type": "nativeScript",
                      "script": {
                          "all": {
                              "issuer": {
                                  "pubKeyHashHex": "{get('cache.dependencies.addressInfo.paymentKeyHash')}"
                              },
                              "timeLock": {
                                  "slotNumEnd": "{get('cache.dependencies.deadlineSlotNumber')}"
                              }
                          }
                      }
                  }
              }
          },
          "build": {
              "type": "buildTx",
              "name": "built-NFTMint",
              "title": "NFT Minting Demo",
              "tx": {
                  "ttl": {
                      "until": "{get('cache.dependencies.deadlineSlotNumber')}"
                  },
                  "mints": [
                      {
                          "policyId": "{get('cache.dependencies.mintingPolicy.scriptHashHex')}",
                          "assets": [
                              {
                                  "assetName": "{get('cache.dependencies.assetName')}",
                                  "quantity": "{get('cache.dependencies.quantity')}"
                              }
                          ]
                      }
                  ],
                  "outputs": {
                      "exampleDrop01": {
                          "address": "addr_test1qrl07u9ssdtdwtzhrt0zrrr79yejxhfvmsmjt9jxqyaz0ktp6ydulqht6r9z4ld0jms3a3c7gw45u32vhc2ftdp2f6rqvz02jw",
                          "assets": [
                              {
                                  "policyId": "ada",
                                  "assetName": "ada",
                                  "quantity": "2000000"
                              },
                              {
                                  "policyId": "{get('cache.dependencies.mintingPolicy.scriptHashHex')}",
                                  "assetName": "{get('cache.dependencies.assetName')}",
                                  "quantity": "1"
                              }
                          ]
                      }
                  },
                  "witnesses": {
                      "nativeScripts": {
                          "mintingScript": "{get('cache.dependencies.mintingPolicy.scriptHex')}"
                      }
                  },
                  "auxiliaryData": {
                      "721": {
                          "{get('cache.dependencies.mintingPolicy.scriptHashHex')}": {
                              "{get('cache.dependencies.assetName')}": {
                                  "name": releaseName,
                                  "image": "<mediaURL>",
                                  "music_metadata_version": 3,
                                  "release": {
                                          "release_type": "<Single/Multiple>",
                                          "release_title": "<releaseTitle>",
                                          "distributor": "<distributor>"
                                            },
                                            "files": [
                                              {
                                                  "name": "<fileName>",
                                                  "mediaType": "<mimeType>",
                                                  "src": "<mediaURL>",
                                                  "song": {
                                                      "song_title": "<songName>",
                                                      "song_duration": "PT<minutes>M<seconds>S",
                                                      "track_number": "<track#>",
                                                      "mood": "<mood>",
                                                      "artists": [
                                                          {
                                                              "name:": "<artistName>",
                                                              "isni": "<isni>",
                                                              "links": {
                                                                      "<linkName>": "<url>",
                                                                      "<link2Name>": "<url>",
                                                                      "<link3Name>": "<url>"
                                                                  }
                                                              },
                                                          {
                                                              "name:": "<artistName>",
                                                              "isni": "<isni>",
                                                              "links": {
                                                                      "<linkName>": "<url>",
                                                                      "<link2Name>": "<url>",
                                                                      "<link3Name>": "<url>"
                                                                  }
                                                              }
                                                      ],
                                                      "featured_artists": [
                                                          {
                                                              "name:": "<artistName>",
                                                              "isni": "<isni>",
                                                              "links": {
                                                                      "<linkName>": "<url>",
                                                                      "<link2Name>": "<url>",
                                                                      "<link3Name>": "<url>"
                                                                  }
                                                              },
                                                         {
                                                              "name:": "<artistName>",
                                                              "isni": "<isni>",
                                                              "links": {
                                                                      "<linkName>": "<url>",
                                                                      "<link2Name>": "<url>",
                                                                      "<link3Name>": "<url>"
                                                                  }
                                                              }
                                                      ],
                                                      "authors": [
                                                          {
                                                                  "name": "<authorName>",
                                                                  "ipi": "<ipi>",
                                                                  "share": "<percentage>"
                                                              },
                                                              {
                                                                  "name": "<authorName>",
                                                                  "ipi": "<ipi>",
                                                                  "share": "<percentage>"
                                                              },
                                                              {
                                                                  "name": "<authorName>",
                                                                  "ipi": "<ipi>",
                                                                  "share": "<percentage>"
                                                              }
                                                      ],
                                                      "contributing_artists": [
                                                          {
                                                             "name": "<artistName>",
                                                                  "ipn": "<ipi>",
                                                                  "role": [
                                                                      "<roleDescription>",
                                                                      "<roleDescription>"
                                                                  ]
                                                              
                                                          },
                                                           {
                                                             "name": "<artistName>",
                                                                  "ipi": "<ipi>",
                                                                  "role": [
                                                                      "<roleDescription>",
                                                                      "<roleDescription>"
                                                                  ]
                                                              
                                                          },
                                                           {
                                                             "name": "<artistName>",
                                                                  "ipi": "<ipi>",
                                                                  "role": [
                                                                      "<roleDescription>",
                                                                      "<roleDescription>"
                                                                  ]
                                                              
                                                          }
                                                      ],
                                                      "collection": "<collectionName>",
                                                      "genres": [
                                                          "<genre>",
                                                          "<genre>",
                                                          "<genre>"
                                                      ],
                                                      "copyright": {"master": "℗ <year, copyrightHolder>", "composition": "© <year, copyrightHolder>"}
                                                  }
                                              }
                                              
                                          ]
  
                              }
                          }
                      }
                  }
              }
          },
          "sign": {
              "type": "signTxs",
              "namePattern": "signed-NFTMint",
              "detailedPermissions": false,
              "txs": [
                  "{get('cache.build.txHex')}"
              ]
          },
          "submit": {
              "type": "submitTxs",
              "namePattern": "submitted-NFTMint",
              "txs": "{get('cache.sign')}"
          },
          "finally": {
              "type": "script",
              "run": {
                  "txHash": {
                      "type": "macro",
                      "run": "{get('cache.build.txHash')}"
                  },
                  "assetName": {
                      "type": "macro",
                      "run": "{get('cache.dependencies.assetName')}"
                  },
                  "policyId": {
                      "type": "macro",
                      "run": "{get('cache.dependencies.mintingPolicy.scriptHashHex')}"
                  },
                  "canMintUntilSlotNumber": {
                      "type": "macro",
                      "run": "{get('cache.dependencies.deadlineSlotNumber')}"
                  },
                  "mintingScript": {
                      "type": "macro",
                      "run": "{get('cache.dependencies.mintingPolicy.scriptHex')}"
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

    if (actionUrl) {
      actionBtn.setAttribute("href", actionUrl)

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
