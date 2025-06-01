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
exports.cmdWallet = cmdWallet;
var axios = require("axios");
var RPC_URL = "https://eth-sepolia.blockscout.com/api/eth-rpc";
var API_URL = "https://eth-sepolia.blockscout.com/api/v2";
var HEADERS = { "Content-Type": "application/json" };
function ethRpc(method, params) {
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
                    return [4 /*yield*/, axios.post(RPC_URL, payload, { headers: HEADERS })];
                case 2:
                    response = _a.sent();
                    return [2 /*return*/, response.data.result];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error in ethRpc: ".concat(error_1));
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function formatNumber(num) {
    if (typeof num === "number") {
        return num.toLocaleString();
    }
    return num;
}
function cmdWallet(args) {
    return __awaiter(this, void 0, void 0, function () {
        var address, balanceWei, _a, balanceEth, txCount, _b, code, isContract, addressResponse, addressData, tokenResponse, tokenData, lastBalanceBlock, hasTokenTransfers, tokensCount, proxyImplementation, txListResponse, txListData, totalGasUsed, transfersCount, _i, _c, tx, error_2;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (args.length === 0) {
                        console.log("Usage: wallet [address]");
                        return [2 /*return*/];
                    }
                    address = args[0];
                    console.log("\nWallet Information for: ".concat(address, "\n"));
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 8, , 9]);
                    _a = parseInt;
                    return [4 /*yield*/, ethRpc("eth_getBalance", [address, "latest"])];
                case 2:
                    balanceWei = _a.apply(void 0, [_e.sent(), 16]);
                    balanceEth = balanceWei / Math.pow(10, 18);
                    _b = parseInt;
                    return [4 /*yield*/, ethRpc("eth_getTransactionCount", [address, "latest"])];
                case 3:
                    txCount = _b.apply(void 0, [_e.sent(), 16]);
                    return [4 /*yield*/, ethRpc("eth_getCode", [address, "latest"])];
                case 4:
                    code = _e.sent();
                    isContract = code !== "0x";
                    return [4 /*yield*/, axios.get("".concat(API_URL, "/addresses/").concat(address))];
                case 5:
                    addressResponse = _e.sent();
                    addressData = addressResponse.data;
                    return [4 /*yield*/, axios.get("".concat(API_URL, "/addresses/").concat(address, "/tokens"))];
                case 6:
                    tokenResponse = _e.sent();
                    tokenData = tokenResponse.data;
                    lastBalanceBlock = addressData.block_number_balance_updated_at || "N/A";
                    hasTokenTransfers = addressData.has_token_transfers || false;
                    tokensCount = ((_d = tokenData.items) === null || _d === void 0 ? void 0 : _d.length) || 0;
                    proxyImplementation = "N/A";
                    if (addressData.implementations && addressData.implementations.length > 0) {
                        proxyImplementation = addressData.implementations[0].address || "Unknown";
                    }
                    return [4 /*yield*/, axios.get("".concat(API_URL, "/addresses/").concat(address, "/transactions"))];
                case 7:
                    txListResponse = _e.sent();
                    txListData = txListResponse.data;
                    totalGasUsed = 0;
                    transfersCount = 0;
                    for (_i = 0, _c = txListData.items || []; _i < _c.length; _i++) {
                        tx = _c[_i];
                        if (tx.gas_used) {
                            totalGasUsed += parseInt(tx.gas_used, 10);
                        }
                        if (tx.method === "transfer") {
                            transfersCount += 1;
                        }
                    }
                    // Format output
                    console.log("Delegated to:      ".concat(isContract ? proxyImplementation : "N/A"));
                    console.log("Balance:           ".concat(balanceEth.toFixed(8), " ETH"));
                    console.log("Tokens:            ".concat(tokensCount));
                    console.log("Net worth:         N/A");
                    console.log("Transactions:      ".concat(txCount));
                    console.log("Transfers:         ".concat(hasTokenTransfers ? transfersCount : 0));
                    console.log("Gas used:          ".concat(formatNumber(totalGasUsed)));
                    console.log("Last balance update: ".concat(lastBalanceBlock));
                    console.log("Account Type:      ".concat(isContract ? "Contract" : "EOA (Externally Owned Account)"));
                    return [3 /*break*/, 9];
                case 8:
                    error_2 = _e.sent();
                    console.error("Error retrieving wallet info: ".concat(error_2));
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
