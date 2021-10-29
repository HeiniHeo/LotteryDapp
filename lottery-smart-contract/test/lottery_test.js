const Lottery = artifacts.require('Lottery');
const { assert } = require("chai");
const assertRevert = require("./assertRevert");
const expectEvent = require('./expectEvent');

contract('Lottery', function ([deployer, user1, user2]) {    //ganache 계정이 순서대로 123번으로 들어오개 된다.
    let lottery;
    let betAmount = 5 * 10 ** 15;
    let betAmountBN = new web3.utils.BN('5000000000000000');
    let betBlockInterval = 3;
    beforeEach(async () => {
        lottery = await Lottery.new();
    });

    it('getpot should return current pot', async () => {
        let pot = await lottery.getPot();
        assert.equal(pot, 0);
    });

    describe('BET',function(){
        it('should fail when the money is not 0.005ETH', async () => {
            // fail transaction
            await assertRevert(lottery.bet('0xab',{from:user1, value:4000000000000000}));
            // transaction object {chainId, value, to, from, gasLimit, gasPrice}
        });
        it('should put the bet to the queue with 1 bet', async () => {
            // bet
            let receipt = await lottery.bet('0xab',{from:user1, value:betAmount});

            let pot = await lottery.getPot();
            assert.equal(pot,0);

            //check contract balance == 0.005ETH 랑 같은지
            let contractBalance = await web3.eth.getBalance(lottery.address);
            assert.equal(contractBalance,betAmount);

            //betting info가 제대로 들어갔는지
            let currentBlockNumber = await web3.eth.getBlockNumber();
            bet = await lottery.getBetInfo(0);
            assert.equal(bet.answerBlockNumber, currentBlockNumber + betBlockInterval);
            assert.equal(bet.bettor, user1);
            assert.equal(bet.challenges,"0xab");

            //log가 제대로 찍혔는지(event가 제대로 찍혔는지)
            await expectEvent.inLogs(receipt.logs,'BET');
        });
    });

    describe('Distribute',function(){
        describe('answer is Checkable',function(){
            it('should give pot to the user when the answer matches', async () => {
                // 두글자 다 맞았을때
                await lottery.setAnswerForTest('0xabded9a9d770b8ce804320a7ea5fd71813d010de3639d632baac7a60317d311d',{from:deployer});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});
                await lottery.betAndDistribute('0xab',{from:user1, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});

                let potBefore = await lottery.getPot();
                let user1BalanceBefore = await web3.eth.getBalance(user1);

                let receipt7 = await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});   // 이때 user1에게 pot이 감
                let potAfter = await lottery.getPot();
                let user1BalanceAfter = await web3.eth.getBalance(user1);

                // pot 머니의 변화 확인
                assert.equal(potBefore.toString(), new web3.utils.BN('10000000000000000').toString());
                assert.equal(potAfter.toString(), new web3.utils.BN('0').toString());

                // bettor의 자산 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.add(potBefore).add(betAmountBN).toString(), new web3.utils.BN(user1BalanceAfter).toString());
            });
            it('should give back the bettors money to themselves when the single answer matches', async () => {
                // 한글자만 맞았을때
                await lottery.setAnswerForTest('0xabded9a9d770b8ce804320a7ea5fd71813d010de3639d632baac7a60317d311d',{from:deployer});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});
                await lottery.betAndDistribute('0xaf',{from:user1, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});

                let potBefore = await lottery.getPot();
                let user1BalanceBefore = await web3.eth.getBalance(user1);

                let receipt7 = await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});   // 이때 user1에게 pot이 감
                let potAfter = await lottery.getPot();
                let user1BalanceAfter = await web3.eth.getBalance(user1);

                // pot 머니의 변화 확인
                assert.equal(potBefore.toString(), potAfter.toString());

                // bettor의 자산 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.add(betAmountBN).toString(), new web3.utils.BN(user1BalanceAfter).toString());
            });
            it('should get bettors money when the answer not matches', async () => {
                // 다 틀렸을때
                await lottery.setAnswerForTest('0xabded9a9d770b8ce804320a7ea5fd71813d010de3639d632baac7a60317d311d',{from:deployer});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user1, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});
                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});

                let potBefore = await lottery.getPot();
                let user1BalanceBefore = await web3.eth.getBalance(user1);

                let receipt7 = await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});   // 이때 user1에게 pot이 감
                let potAfter = await lottery.getPot();
                let user1BalanceAfter = await web3.eth.getBalance(user1);

                // pot 머니의 변화 확인
                assert.equal(potBefore.add(betAmountBN).toString(), potAfter.toString());

                // bettor의 자산 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.toString(), new web3.utils.BN(user1BalanceAfter).toString());
            });
        })
        describe('not revealed ',function(){    // 아무것도 일어나지 않았다. smartcontractbalance, potmoneybalance,userbalance를 체크해서 확인

        })
        describe('block limit passed',function(){   // 배팅에 상관없이 트랜잭션이 생길때 마다 block을 계속 증가시킨다.
            // evm_mine 블럭을 마인 시킨다. evm_increaseTime으로 시간을 증가시킬 수 있음.

        })
    })

    describe('isMatch',function(){
        let blockHash = "0xabded9a9d770b8ce804320a7ea5fd71813d010de3639d632baac7a60317d311d";

        it('should be return BettingResult.Win when answer is matched', async() => {
            let matchingResult = await lottery.isMatch('0xab',blockHash);
            assert.equal(matchingResult,1);
        })
        it('should be return BettingResult.Fail when answer is matched', async() => {
            
            let matchingResult = await lottery.isMatch('0xcd',blockHash);
            assert.equal(matchingResult,0);
        })
        it('should be return BettingResult.Draw when answer is matched', async() => {
            let matchingResult = await lottery.isMatch('0xac',blockHash);
            assert.equal(matchingResult,2);

            matchingResult = await lottery.isMatch('0xfb',blockHash);
            assert.equal(matchingResult,2);
        })
    })
});