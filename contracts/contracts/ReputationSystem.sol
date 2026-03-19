// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
//  Polkadot Reputation Badge System
//  Soulbound NFT (ERC-5192) with Tier-based Reputation
//
//  Contracts:
//    1. IReputationOracle     — Interface for score queries
//    2. ReputationStorage     — Stores scores & history
//    3. ReputationBadge       — Soulbound NFT (ERC-5192)
//    4. ReputationRegistry    — Main entry point & access control
// ============================================================

// ─────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 {
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );
    event Approval(
        address indexed owner,
        address indexed approved,
        uint256 indexed tokenId
    );
    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(
        address owner,
        address operator
    ) external view returns (bool);
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external;
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

/// @title ERC-5192: Minimal Soulbound NFT interface
interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

/// @title IReputationOracle: External reputation score interface
interface IReputationOracle {
    function getPercentile(address wallet) external view returns (uint256);
    function getSubScore(
        address wallet,
        string calldata dimension
    ) external view returns (uint256);
    function getTier(address wallet) external view returns (uint8);
}

// ─────────────────────────────────────────────
// LIBRARIES
// ─────────────────────────────────────────────

library Strings {
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

// ─────────────────────────────────────────────
// CONTRACT 1: ReputationStorage
// Stores on-chain scores, history, and tier metadata
// ─────────────────────────────────────────────

contract ReputationStorage {
    // ── Enums ──────────────────────────────────
    enum Tier {
        None, // 0 — not evaluated
        Bronze, // 1 — below 50%
        Silver, // 2 — 50th–75th percentile
        Gold, // 3 — 75th–85th percentile
        Platinum, // 4 — 85th–95th percentile
        Diamond // 5 — top 5%
    }

    // ── Structs ────────────────────────────────
    struct Score {
        uint256 compositePercentile; // 0–10000 (basis points, e.g. 9320 = 93.20%)
        uint256 governancePercentile;
        uint256 economicPercentile;
        uint256 identityPercentile;
        uint256 socialPercentile;
        Tier tier;
        uint256 snapshotBlock;
        uint256 updatedAt; // unix timestamp
        bool exists;
    }

    struct ScoreSnapshot {
        uint256 compositePercentile;
        Tier tier;
        uint256 timestamp;
    }

    // ── Storage ────────────────────────────────
    mapping(address => Score) internal _scores;
    mapping(address => ScoreSnapshot[]) internal _history;

    address public registry;
    uint256 public constant MAX_HISTORY = 52; // keep last 52 snapshots (~1 year weekly)

    // ── Events ────────────────────────────────
    event ScoreUpdated(
        address indexed wallet,
        Tier oldTier,
        Tier newTier,
        uint256 compositePercentile,
        uint256 snapshotBlock
    );

    // ── Modifiers ─────────────────────────────
    modifier onlyRegistry() {
        require(msg.sender == registry, "Storage: caller is not registry");
        _;
    }

    constructor(address _registry) {
        registry = _registry;
    }

    // ── Write ──────────────────────────────────

    /// @notice Update score for a wallet (called by registry/oracle)
    function updateScore(
        address wallet,
        uint256 compositePercentile,
        uint256 governancePercentile,
        uint256 economicPercentile,
        uint256 identityPercentile,
        uint256 socialPercentile,
        uint256 snapshotBlock
    ) external onlyRegistry returns (Tier oldTier, Tier newTier) {
        oldTier = _scores[wallet].tier;
        newTier = _computeTier(compositePercentile);

        // Save snapshot before overwriting
        if (_scores[wallet].exists) {
            _pushHistory(wallet, _scores[wallet].compositePercentile, oldTier);
        }

        _scores[wallet] = Score({
            compositePercentile: compositePercentile,
            governancePercentile: governancePercentile,
            economicPercentile: economicPercentile,
            identityPercentile: identityPercentile,
            socialPercentile: socialPercentile,
            tier: newTier,
            snapshotBlock: snapshotBlock,
            updatedAt: block.timestamp,
            exists: true
        });

        emit ScoreUpdated(
            wallet,
            oldTier,
            newTier,
            compositePercentile,
            snapshotBlock
        );
    }

    // ── Read ───────────────────────────────────

    function getScore(address wallet) external view returns (Score memory) {
        return _scores[wallet];
    }

    function getTier(address wallet) external view returns (Tier) {
        return _scores[wallet].tier;
    }

    function getPercentile(address wallet) external view returns (uint256) {
        return _scores[wallet].compositePercentile;
    }

    function getHistory(
        address wallet
    ) external view returns (ScoreSnapshot[] memory) {
        return _history[wallet];
    }

    function hasScore(address wallet) external view returns (bool) {
        return _scores[wallet].exists;
    }

    // ── Internal ───────────────────────────────

    /// @dev Percentile in basis points (0–10000)
    /// Stone   < 5000  (bottom 50%)
    /// Bronze  5000–7499
    /// Silver  7500–8999
    /// Gold    9000–9699
    /// Diamond >= 9700 (top 3%)
    function _computeTier(uint256 bps) internal pure returns (Tier) {
        if (bps >= 9500) return Tier.Diamond; // >= 95%
        if (bps >= 8500) return Tier.Platinum; // >= 85%
        if (bps >= 7500) return Tier.Gold; // >= 75%
        if (bps >= 5000) return Tier.Silver; // >= 50%
        return Tier.Bronze; // < 50%
    }

    function _pushHistory(address wallet, uint256 pct, Tier tier) internal {
        ScoreSnapshot[] storage history = _history[wallet];
        if (history.length >= MAX_HISTORY) {
            // Shift left (drop oldest)
            for (uint256 i = 0; i < history.length - 1; i++) {
                history[i] = history[i + 1];
            }
            history[history.length - 1] = ScoreSnapshot(
                pct,
                tier,
                block.timestamp
            );
        } else {
            history.push(ScoreSnapshot(pct, tier, block.timestamp));
        }
    }
}

// ─────────────────────────────────────────────
// CONTRACT 2: ReputationBadge
// Soulbound ERC-721 + ERC-5192 NFT Badge
// ─────────────────────────────────────────────

contract ReputationBadge is IERC165, IERC721Metadata, IERC5192 {
    using Strings for uint256;

    // ── Storage ────────────────────────────────
    string public name = "Polkadot Reputation Badge";
    string public symbol = "PRB";

    address public registry;
    string public baseURI; // IPFS base URI for metadata

    uint256 private _nextTokenId = 1;

    mapping(uint256 => address) private _owners; // tokenId → owner
    mapping(address => uint256) private _tokenOf; // wallet  → tokenId (0 = none)
    mapping(uint256 => ReputationStorage.Tier) public tierOf; // tokenId → tier at mint

    // Soulbound: all tokens locked forever
    mapping(uint256 => bool) private _locked;

    // ── Events ────────────────────────────────
    event BadgeMinted(
        address indexed wallet,
        uint256 indexed tokenId,
        ReputationStorage.Tier tier
    );
    event BadgeUpgraded(
        address indexed wallet,
        uint256 indexed tokenId,
        ReputationStorage.Tier oldTier,
        ReputationStorage.Tier newTier
    );
    event BadgeDowngraded(
        address indexed wallet,
        uint256 indexed tokenId,
        ReputationStorage.Tier oldTier,
        ReputationStorage.Tier newTier
    );
    event BadgeBurned(address indexed wallet, uint256 indexed tokenId);

    // ── Modifiers ─────────────────────────────
    modifier onlyRegistry() {
        require(msg.sender == registry, "Badge: caller is not registry");
        _;
    }

    constructor(address _registry, string memory _baseURI) {
        registry = _registry;
        baseURI = _baseURI;
    }

    // ── Core Badge Logic ───────────────────────

    /// @notice Mint a new soulbound badge (only if wallet has none)
    function mint(
        address wallet,
        ReputationStorage.Tier tier
    ) external onlyRegistry returns (uint256 tokenId) {
        require(_tokenOf[wallet] == 0, "Badge: wallet already has a badge");
        require(
            tier != ReputationStorage.Tier.None,
            "Badge: cannot mint None tier"
        );

        tokenId = _nextTokenId++;
        _owners[tokenId] = wallet;
        _tokenOf[wallet] = tokenId;
        tierOf[tokenId] = tier;
        _locked[tokenId] = true;

        emit Transfer(address(0), wallet, tokenId);
        emit Locked(tokenId);
        emit BadgeMinted(wallet, tokenId, tier);
    }

    /// @notice Update tier on existing badge (upgrade or downgrade)
    function updateTier(
        address wallet,
        ReputationStorage.Tier newTier
    ) external onlyRegistry {
        uint256 tokenId = _tokenOf[wallet];
        require(tokenId != 0, "Badge: wallet has no badge");

        ReputationStorage.Tier oldTier = tierOf[tokenId];
        tierOf[tokenId] = newTier;

        if (newTier > oldTier) {
            emit BadgeUpgraded(wallet, tokenId, oldTier, newTier);
        } else {
            emit BadgeDowngraded(wallet, tokenId, oldTier, newTier);
        }
    }

    /// @notice Burn badge (e.g. if wallet drops to Stone tier or is flagged)
    function burn(address wallet) external onlyRegistry {
        uint256 tokenId = _tokenOf[wallet];
        require(tokenId != 0, "Badge: wallet has no badge");

        delete _owners[tokenId];
        delete _tokenOf[wallet];
        delete tierOf[tokenId];
        delete _locked[tokenId];

        emit Transfer(wallet, address(0), tokenId);
        emit BadgeBurned(wallet, tokenId);
    }

    // ── Read ───────────────────────────────────

    function hasBadge(address wallet) external view returns (bool) {
        return _tokenOf[wallet] != 0;
    }

    function tokenIdOf(address wallet) external view returns (uint256) {
        return _tokenOf[wallet];
    }

    function currentTier(
        address wallet
    ) external view returns (ReputationStorage.Tier) {
        uint256 tokenId = _tokenOf[wallet];
        if (tokenId == 0) return ReputationStorage.Tier.None;
        return tierOf[tokenId];
    }

    // ── ERC-721 (soulbound overrides) ──────────

    function balanceOf(address owner) external view override returns (uint256) {
        return _tokenOf[owner] != 0 ? 1 : 0;
    }

    function ownerOf(uint256 tokenId) external view override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Badge: token does not exist");
        return owner;
    }

    /// @dev ALL transfer functions revert — soulbound
    function transferFrom(address, address, uint256) external pure override {
        revert("Badge: soulbound token, non-transferable");
    }

    function safeTransferFrom(
        address,
        address,
        uint256
    ) external pure override {
        revert("Badge: soulbound token, non-transferable");
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override {
        revert("Badge: soulbound token, non-transferable");
    }

    function approve(address, uint256) external pure override {
        revert("Badge: soulbound token, approvals disabled");
    }

    function setApprovalForAll(address, bool) external pure override {
        revert("Badge: soulbound token, approvals disabled");
    }

    function getApproved(uint256) external pure override returns (address) {
        return address(0);
    }

    function isApprovedForAll(
        address,
        address
    ) external pure override returns (bool) {
        return false;
    }

    // ── ERC-5192 ───────────────────────────────

    function locked(uint256 tokenId) external view override returns (bool) {
        require(_owners[tokenId] != address(0), "Badge: token does not exist");
        return _locked[tokenId];
    }

    // ── ERC-721 Metadata ───────────────────────

    /// @notice Returns IPFS URI with tier-specific metadata
    /// e.g. ipfs://Qm.../3.json for Silver (tier index 3)
    function tokenURI(
        uint256 tokenId
    ) external view override returns (string memory) {
        require(_owners[tokenId] != address(0), "Badge: token does not exist");
        uint256 tierIndex = uint256(tierOf[tokenId]);
        return string(abi.encodePacked(baseURI, tierIndex.toString(), ".json"));
    }

    function setBaseURI(string memory _baseURI) external onlyRegistry {
        baseURI = _baseURI;
    }

    // ── ERC-165 ───────────────────────────────

    function supportsInterface(
        bytes4 interfaceId
    ) external pure override returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            interfaceId == type(IERC5192).interfaceId;
    }
}

// ─────────────────────────────────────────────
// CONTRACT 3: ReputationRegistry
// Main entry point: access control, oracle sig
// verification, and orchestration
// ─────────────────────────────────────────────

contract ReputationRegistry {
    // ── Access Control ────────────────────────
    address public owner;
    address public pendingOwner;
    mapping(address => bool) public isOracle; // trusted score submitters
    mapping(address => bool) public isOperator; // trusted operators (pause, config)

    // ── Contract References ───────────────────
    ReputationStorage public scoreStorage;
    ReputationBadge public badge;

    // ── Config ────────────────────────────────
    bool public paused;
    uint256 public minTierForBadge = 1; // Bronze and above get badges
    uint256 public scoreValiditySeconds = 28 days; // Score expires after 28 days

    // ── Nonce (replay protection) ──────────────
    mapping(address => uint256) public nonces;

    // ── Events ────────────────────────────────
    event OracleAdded(address indexed oracle);
    event OracleRemoved(address indexed oracle);
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    event ScoreSubmitted(
        address indexed wallet,
        ReputationStorage.Tier oldTier,
        ReputationStorage.Tier newTier
    );
    event Paused(address by);
    event Unpaused(address by);
    event OwnershipTransferInitiated(address indexed newOwner);
    event OwnershipTransferred(
        address indexed oldOwner,
        address indexed newOwner
    );

    // ── Modifiers ─────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Registry: caller is not owner");
        _;
    }

    modifier onlyOracle() {
        require(isOracle[msg.sender], "Registry: caller is not oracle");
        _;
    }

    modifier notPaused() {
        require(!paused, "Registry: system is paused");
        _;
    }

    // ── Constructor ───────────────────────────
    constructor(string memory badgeBaseURI) {
        owner = msg.sender;
        isOracle[msg.sender] = true;
        isOperator[msg.sender] = true;

        // Deploy sub-contracts
        scoreStorage = new ReputationStorage(address(this));
        badge = new ReputationBadge(address(this), badgeBaseURI);
    }

    // ── Oracle: Submit Score ───────────────────

    /// @notice Submit a score update with oracle signature (trustless verification)
    /// @param wallet           Target wallet address
    /// @param compositePct     Composite percentile in basis points (0–10000)
    /// @param governancePct    Governance sub-score
    /// @param economicPct      Economic sub-score
    /// @param identityPct      Identity sub-score
    /// @param socialPct        Social sub-score
    /// @param snapshotBlock    Block number of the on-chain snapshot
    /// @param signature        ECDSA signature from trusted oracle
    function submitScore(
        address wallet,
        uint256 compositePct,
        uint256 governancePct,
        uint256 economicPct,
        uint256 identityPct,
        uint256 socialPct,
        uint256 snapshotBlock,
        bytes calldata signature
    ) external notPaused {
        // Validate inputs
        require(wallet != address(0), "Registry: invalid wallet");
        require(compositePct <= 10000, "Registry: percentile out of range");
        require(governancePct <= 10000, "Registry: percentile out of range");
        require(economicPct <= 10000, "Registry: percentile out of range");
        require(identityPct <= 10000, "Registry: percentile out of range");
        require(socialPct <= 10000, "Registry: percentile out of range");
        require(snapshotBlock <= block.number, "Registry: future block");

        // Verify oracle signature
        uint256 nonce = nonces[wallet];
        bytes32 messageHash = _hashScoreData(
            wallet,
            compositePct,
            governancePct,
            economicPct,
            identityPct,
            socialPct,
            snapshotBlock,
            nonce
        );
        address signer = _recoverSigner(messageHash, signature);
        require(isOracle[signer], "Registry: invalid oracle signature");

        // Increment nonce (replay protection)
        nonces[wallet]++;

        // Update score in storage
        (
            ReputationStorage.Tier oldTier,
            ReputationStorage.Tier newTier
        ) = scoreStorage.updateScore(
                wallet,
                compositePct,
                governancePct,
                economicPct,
                identityPct,
                socialPct,
                snapshotBlock
            );

        // Update badge
        _syncBadge(wallet, oldTier, newTier);

        emit ScoreSubmitted(wallet, oldTier, newTier);
    }

    /// @notice Batch submit scores (gas efficient for multiple wallets)
    function batchSubmitScores(
        address[] calldata wallets,
        uint256[] calldata compositePcts,
        uint256[] calldata governancePcts,
        uint256[] calldata economicPcts,
        uint256[] calldata identityPcts,
        uint256[] calldata socialPcts,
        uint256[] calldata snapshotBlocks,
        bytes[] calldata signatures
    ) external notPaused onlyOracle {
        require(
            wallets.length == compositePcts.length &&
                wallets.length == signatures.length,
            "Registry: array length mismatch"
        );

        for (uint256 i = 0; i < wallets.length; i++) {
            (
                ReputationStorage.Tier oldTier,
                ReputationStorage.Tier newTier
            ) = scoreStorage.updateScore(
                    wallets[i],
                    compositePcts[i],
                    governancePcts[i],
                    economicPcts[i],
                    identityPcts[i],
                    socialPcts[i],
                    snapshotBlocks[i]
                );
            _syncBadge(wallets[i], oldTier, newTier);
            emit ScoreSubmitted(wallets[i], oldTier, newTier);
        }
    }

    // ── Read: Score Queries ────────────────────

    /// @notice Get full score for a wallet
    function getScore(
        address wallet
    ) external view returns (ReputationStorage.Score memory) {
        return scoreStorage.getScore(wallet);
    }

    /// @notice Get tier enum for a wallet
    function getTier(
        address wallet
    ) external view returns (ReputationStorage.Tier) {
        return scoreStorage.getTier(wallet);
    }

    /// @notice Get composite percentile (basis points)
    function getPercentile(address wallet) external view returns (uint256) {
        return scoreStorage.getPercentile(wallet);
    }

    /// @notice Check if wallet meets a minimum tier requirement
    function meetsMinTier(
        address wallet,
        ReputationStorage.Tier minTier
    ) external view returns (bool) {
        return scoreStorage.getTier(wallet) >= minTier;
    }

    /// @notice Check if wallet is in top X percentile (basis points)
    function meetsMinPercentile(
        address wallet,
        uint256 minBps
    ) external view returns (bool) {
        return scoreStorage.getPercentile(wallet) >= minBps;
    }

    /// @notice Check if score is still valid (not expired)
    function isScoreValid(address wallet) external view returns (bool) {
        ReputationStorage.Score memory s = scoreStorage.getScore(wallet);
        if (!s.exists) return false;
        return (block.timestamp - s.updatedAt) <= scoreValiditySeconds;
    }

    /// @notice Get score history snapshots
    function getHistory(
        address wallet
    ) external view returns (ReputationStorage.ScoreSnapshot[] memory) {
        return scoreStorage.getHistory(wallet);
    }

    // ── Read: Badge Queries ────────────────────

    function hasBadge(address wallet) external view returns (bool) {
        return badge.hasBadge(wallet);
    }

    function getBadgeTier(
        address wallet
    ) external view returns (ReputationStorage.Tier) {
        return badge.currentTier(wallet);
    }

    // ── Internal: Badge Sync ───────────────────

    function _syncBadge(
        address wallet,
        ReputationStorage.Tier oldTier,
        ReputationStorage.Tier newTier
    ) internal {
        bool hasBadgeNow = badge.hasBadge(wallet);
        bool shouldHaveBadge = uint256(newTier) >= minTierForBadge;

        if (!hasBadgeNow && shouldHaveBadge) {
            // Mint new badge
            badge.mint(wallet, newTier);
        } else if (hasBadgeNow && !shouldHaveBadge) {
            // Burn badge (dropped to Stone)
            badge.burn(wallet);
        } else if (hasBadgeNow && shouldHaveBadge && newTier != oldTier) {
            // Update tier on existing badge
            badge.updateTier(wallet, newTier);
        }
    }

    // ── Internal: Signature Verification ──────

    function _hashScoreData(
        address wallet,
        uint256 compositePct,
        uint256 governancePct,
        uint256 economicPct,
        uint256 identityPct,
        uint256 socialPct,
        uint256 snapshotBlock,
        uint256 nonce
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    _domainSeparator(),
                    keccak256(
                        abi.encode(
                            keccak256(
                                "ScoreData(address wallet,uint256 compositePct,uint256 governancePct,uint256 economicPct,uint256 identityPct,uint256 socialPct,uint256 snapshotBlock,uint256 nonce)"
                            ),
                            wallet,
                            compositePct,
                            governancePct,
                            economicPct,
                            identityPct,
                            socialPct,
                            snapshotBlock,
                            nonce
                        )
                    )
                )
            );
    }

    function _domainSeparator() internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256("PolkadotReputationRegistry"),
                    keccak256("1"),
                    block.chainid,
                    address(this)
                )
            );
    }

    function _recoverSigner(
        bytes32 hash,
        bytes calldata signature
    ) internal pure returns (address) {
        require(signature.length == 65, "Registry: invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        return ecrecover(hash, v, r, s);
    }

    // ── Admin: Access Control ──────────────────

    function addOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "Registry: zero address");
        isOracle[oracle] = true;
        emit OracleAdded(oracle);
    }

    function removeOracle(address oracle) external onlyOwner {
        isOracle[oracle] = false;
        emit OracleRemoved(oracle);
    }

    function addOperator(address operator) external onlyOwner {
        isOperator[operator] = true;
        emit OperatorAdded(operator);
    }

    function removeOperator(address operator) external onlyOwner {
        isOperator[operator] = false;
        emit OperatorRemoved(operator);
    }

    // ── Admin: Config ──────────────────────────

    function setMinTierForBadge(uint256 tier) external onlyOwner {
        require(tier <= 5, "Registry: invalid tier");
        minTierForBadge = tier;
    }

    function setScoreValiditySeconds(uint256 seconds_) external onlyOwner {
        require(seconds_ >= 1 days, "Registry: validity too short");
        scoreValiditySeconds = seconds_;
    }

    function setBadgeBaseURI(string memory uri) external onlyOwner {
        badge.setBaseURI(uri);
    }

    // ── Admin: Pause ───────────────────────────

    function pause() external {
        require(isOperator[msg.sender], "Registry: not operator");
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external {
        require(isOperator[msg.sender], "Registry: not operator");
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ── Admin: Ownership Transfer (2-step) ────

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Registry: zero address");
        pendingOwner = newOwner;
        emit OwnershipTransferInitiated(newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Registry: not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
}

// ─────────────────────────────────────────────
// CONTRACT 4: ReputationGate
// Utility contract — protocols integrate this
// to gate-keep features behind reputation tiers
// ─────────────────────────────────────────────

contract ReputationGate {
    ReputationRegistry public immutable registry;

    constructor(address _registry) {
        registry = ReputationRegistry(_registry);
    }

    // ── Modifiers for downstream protocols ────

    /// @notice Require wallet to be at least Bronze (top 50%)
    modifier atLeastBronze(address wallet) {
        require(
            registry.meetsMinTier(wallet, ReputationStorage.Tier.Bronze),
            "Gate: requires Bronze tier or above"
        );
        _;
    }

    /// @notice Require wallet to be at least Silver (top 25%)
    modifier atLeastSilver(address wallet) {
        require(
            registry.meetsMinTier(wallet, ReputationStorage.Tier.Silver),
            "Gate: requires Silver tier or above"
        );
        _;
    }

    /// @notice Require wallet to be at least Gold (top 10%)
    modifier atLeastGold(address wallet) {
        require(
            registry.meetsMinTier(wallet, ReputationStorage.Tier.Gold),
            "Gate: requires Gold tier or above"
        );
        _;
    }

    /// @notice Require wallet to be Diamond (top 3%)
    modifier onlyDiamond(address wallet) {
        require(
            registry.meetsMinTier(wallet, ReputationStorage.Tier.Diamond),
            "Gate: requires Diamond tier"
        );
        _;
    }

    /// @notice Require wallet to meet a raw percentile threshold
    modifier atLeastPercentile(address wallet, uint256 minBps) {
        require(
            registry.meetsMinPercentile(wallet, minBps),
            "Gate: percentile threshold not met"
        );
        _;
    }

    // ── Helper: check functions (for UI) ──────

    function canAccess(
        address wallet,
        ReputationStorage.Tier minTier
    ) external view returns (bool) {
        return registry.meetsMinTier(wallet, minTier);
    }

    function canAccessByPercentile(
        address wallet,
        uint256 minBps
    ) external view returns (bool) {
        return registry.meetsMinPercentile(wallet, minBps);
    }
}

// ─────────────────────────────────────────────
// EXAMPLE: EventTicketing
// Shows how Sub0 / Web3 Summit would integrate
// ─────────────────────────────────────────────

contract EventTicketing is ReputationGate {
    struct Event {
        string name;
        uint256 maxAttendees;
        uint256 registeredCount;
        ReputationStorage.Tier minTier; // minimum tier to register
        bool active;
    }

    mapping(uint256 => Event) public events;
    mapping(uint256 => mapping(address => bool)) public registered;
    uint256 public nextEventId = 1;

    address public organizer;

    event EventCreated(
        uint256 indexed eventId,
        string name,
        ReputationStorage.Tier minTier
    );
    event AttendeeRegistered(uint256 indexed eventId, address indexed wallet);

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Ticketing: not organizer");
        _;
    }

    constructor(address _registry) ReputationGate(_registry) {
        organizer = msg.sender;
    }

    function createEvent(
        string memory eventName,
        uint256 maxAttendees,
        ReputationStorage.Tier minTier
    ) external onlyOrganizer returns (uint256 eventId) {
        eventId = nextEventId++;
        events[eventId] = Event({
            name: eventName,
            maxAttendees: maxAttendees,
            registeredCount: 0,
            minTier: minTier,
            active: true
        });
        emit EventCreated(eventId, eventName, minTier);
    }

    /// @notice Register for an event — checks reputation gate automatically
    function register(uint256 eventId) external {
        Event storage evt = events[eventId];
        require(evt.active, "Ticketing: event not active");
        require(
            !registered[eventId][msg.sender],
            "Ticketing: already registered"
        );
        require(
            evt.registeredCount < evt.maxAttendees,
            "Ticketing: event is full"
        );
        require(
            registry.meetsMinTier(msg.sender, evt.minTier),
            "Ticketing: reputation tier too low"
        );
        require(
            registry.isScoreValid(msg.sender),
            "Ticketing: reputation score expired, please refresh"
        );

        registered[eventId][msg.sender] = true;
        evt.registeredCount++;

        emit AttendeeRegistered(eventId, msg.sender);
    }
}
