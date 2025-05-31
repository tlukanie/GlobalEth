"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdIdentify = cmdIdentify;
var axios = require("axios");
var NETWORKS = [
    {
        name: "Sepolia Testnet",
        rpc_url: "https://eth-sepolia.blockscout.com/api/eth-rpc",
        explorer_url: "https://eth-sepolia.blockscout.com/tx"
    },
    {
        name: "Rootstock Testnet",
        rpc_url: "https://rootstock-testnet.blockscout.com/api/eth-rpc",
        explorer_url: "https://rootstock-testnet.blockscout.com/tx"
    }
];
var HEADERS = { "Content-Type": "application/json" };
function ethRpc(url, method, params) {
    return __awaiter(this, void 0, void 0, function () {
        var payload, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = {
                        jsonrpc: "2.0",
                        id: 1,
                        method: method,
                        params: params
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios.post(url, payload, { headers: HEADERS, timeout: 5000 })];
                case 2:
                    response = _a.sent();
                    return [2 /*return*/, response.data.result];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error in ethRpc: ".concat(error_1));
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function checkTransactionInNetwork(network, txHash) {
    return __awaiter(this, void 0, void 0, function () {
        var tx, receipt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ethRpc(network.rpc_url, "eth_getTransactionByHash", [txHash])];
                case 1:
                    tx = _a.sent();
                    if (!tx)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, ethRpc(network.rpc_url, "eth_getTransactionReceipt", [txHash])];
                case 2:
                    receipt = (_a.sent()) || {};
                    return [2 /*return*/, { network: network, tx: tx, receipt: receipt }];
            }
        });
    });
}
function identifyIntent(userInput) {
    return __awaiter(this, void 0, void 0, function () {
        var apiUrl, headers, payload, response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    apiUrl = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
                    headers = { Authorization: "Bearer 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" };
                    payload = {
                        inputs: userInput,
                        parameters: { candidate_labels: ["wallet", "transaction"] }
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios.post(apiUrl, payload, { headers: headers })];
                case 2:
                    response = _a.sent();
                    return [2 /*return*/, response.data.labels[0]]; // Return the top label
                case 3:
                    error_2 = _a.sent();
                    console.error("Error identifying intent: ".concat(error_2));
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function cmdIdentify(args) {
    return __awaiter(this, void 0, void 0, function () {
        var userInput, intent, txHash, result, _i, NETWORKS_1, network_1, tx, receipt, network, status_1, blockNum, from, to, valueWei, gasUsed, gasLimit, gasPrice, feeWei;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.length) {
                        console.log("Usage: identify [query]");
                        return [2 /*return*/];
                    }
                    userInput = args.join(" ");
                    return [4 /*yield*/, identifyIntent(userInput)];
                case 1:
                    intent = _a.sent();
                    if (!(intent === "transaction")) return [3 /*break*/, 6];
                    txHash = userInput.split(" ").pop() || "";
                    console.log("Looking up transaction: ".concat(txHash));
                    result = null;
                    _i = 0, NETWORKS_1 = NETWORKS;
                    _a.label = 2;
                case 2:
                    if (!(_i < NETWORKS_1.length)) return [3 /*break*/, 5];
                    network_1 = NETWORKS_1[_i];
                    console.log("Checking ".concat(network_1.name, "..."));
                    return [4 /*yield*/, checkTransactionInNetwork(network_1, txHash)];
                case 3:
                    result = _a.sent();
                    if (result) {
                        console.log("Transaction found on ".concat(network_1.name, "!"));
                        return [3 /*break*/, 5];
                    }
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    if (!result) {
                        console.log("Transaction not found in any supported network.");
                        return [2 /*return*/];
                    }
                    tx = result.tx, receipt = result.receipt, network = result.network;
                    status_1 = receipt.status || "0x0";
                    blockNum = parseInt(tx.blockNumber || "0x0", 16);
                    from = tx.from;
                    to = tx.to;
                    valueWei = parseInt(tx.value || "0x0", 16);
                    gasUsed = parseInt(receipt.gasUsed || "0x0", 16);
                    gasLimit = parseInt(tx.gas || "0x0", 16);
                    gasPrice = parseInt(tx.gasPrice || "0x0", 16);
                    feeWei = gasUsed * gasPrice;
                    console.log("\nTransaction Details (".concat(network.name, ")"));
                    console.log("Transaction:   ".concat(txHash));
                    console.log("Status:        ".concat(status_1 === "0x1" ? "Success" : "Failed"));
                    console.log("Block:         ".concat(blockNum));
                    console.log("From:          ".concat(from));
                    console.log("To:            ".concat(to));
                    console.log("Value:         ".concat((valueWei / Math.pow(10, 18)).toFixed(6), " ETH"));
                    console.log("Gas used:      ".concat(gasUsed, " / ").concat(gasLimit));
                    console.log("Gas price:     ".concat((gasPrice / Math.pow(10, 9)).toFixed(2), " Gwei"));
                    console.log("Fee:           ".concat((feeWei / Math.pow(10, 18)).toFixed(6), " ETH"));
                    console.log("Explorer URL:  ".concat(network.explorer_url, "/").concat(txHash));
                    return [3 /*break*/, 7];
                case 6:
                    if (intent === "wallet") {
                        console.log("Wallet lookup is not implemented yet.");
                        // Add wallet lookup logic here
                    }
                    else {
                        console.log("Could not determine intent. Please specify if it's a wallet or transaction query.");
                    }
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    });
}
