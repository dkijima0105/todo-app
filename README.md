# タスク管理アプリ

React、Django REST Framework、nginxを使用したモダンなタスク管理アプリケーションです。

## 🚀 技術スタック

- **フロントエンド**: React 18
- **バックエンド**: Django 4.2 + Django REST Framework
- **データベース**: PostgreSQL
- **Webサーバー**: nginx
- **開発環境**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **コード品質**: Black, isort, flake8, ESLint
- **セキュリティ**: Trivy vulnerability scanner
- **依存関係管理**: Dependabot

## 🔄 CI/CD パイプライン

このプロジェクトは GitHub Actions を使用した包括的な CI/CD パイプラインを実装しています。

### 🧪 継続的インテグレーション (CI)

#### プルリクエスト時の自動チェック:
- ✅ **コード品質チェック**: Python (Black, isort, flake8) と JavaScript (ESLint)
- ✅ **自動テスト**: Django テストと React テストの実行
- ✅ **依存関係チェック**: セキュリティ脆弱性の確認

#### メインブランチのプッシュ時:
- ✅ **フルテストスイート**: バックエンド・フロントエンドの包括的テスト
  - Django: 12テストケース（Model、API、Filter）
  - React: 7テストケース（コンポーネント、統合）
- ✅ **Docker イメージビルド**: 本番環境用イメージの作成
- ✅ **セキュリティスキャン**: Trivy による脆弱性スキャン
- ✅ **Docker Hub プッシュ**: 本番用イメージの自動デプロイ

### 🚀 継続的デプロイメント (CD)

- **Docker イメージ**: 自動的に Docker Hub にプッシュ
- **バージョン管理**: Git コミットハッシュとブランチ名でタグ付け
- **セキュリティ**: GitHub Security タブで脆弱性レポート
- **自動デプロイ**: 本番環境への自動デプロイ（設定次第）

### 📊 ワークフロー

1. **PR Check** (`pr-check.yml`):
   - コードの品質チェック
   - 基本テストの実行
   - プルリクエストの自動検証

2. **Main CI/CD** (`ci-cd.yml`):
   - フルテストスイート
   - Docker イメージビルド・プッシュ
   - セキュリティスキャン
   - 本番デプロイ
   - **🎯 手動実行対応**: GitHubのActionsタブから「Run workflow」で実行可能

3. **Dependabot** (`.github/dependabot.yml`):
   - 依存関係の自動更新
   - セキュリティパッチの自動適用
   - 毎週月曜日に更新チェック

### 🚀 CI/CD実行方法

#### 自動実行
- **プルリクエスト作成時**: テストとコード品質チェックを自動実行
- **メインブランチへのプッシュ**: フルCI/CDパイプラインを自動実行

#### 手動実行
1. GitHubリポジトリの **Actions** タブを開く
2. 「CI/CD Pipeline」ワークフローを選択
3. **Run workflow** ボタンをクリック
4. ブランチを選択し、デプロイ有効/無効を選択
5. **Run workflow** で実行開始

## ⚙️ CI/CD セットアップ

### 📋 必要なRepository Secrets設定

CI/CDパイプラインを完全に動作させるには、以下のGitHub Repository Secretsを設定する必要があります：

#### 設定手順
1. GitHubリポジトリページで **Settings** → **Secrets and variables** → **Actions**
2. **Repository secrets** → **New repository secret**
3. 以下の2つのシークレットを追加：

| Name | Value | 説明 |
|------|-------|------|
| `DOCKER_USERNAME` | `majikijima` | Docker Hubのユーザー名 |
| `DOCKER_PASSWORD` | `[アクセストークン]` | Docker Hubで生成したアクセストークン |

### 🐳 Docker Hub設定

#### アクセストークン作成手順
1. [Docker Hub](https://hub.docker.com) にログイン
2. **Account Settings** → **Security** → **New Access Token**
3. トークン名を入力（例：`github-actions-todo-app`）
4. 権限を選択（**Public Repo Read/Write** を推奨）
5. **Generate** をクリックしてトークンを生成
6. 生成されたトークンをコピーし、GitHubの `DOCKER_PASSWORD` シークレットに設定

#### 対象Dockerイメージ
CI/CDパイプラインでは以下のイメージをDocker Hubにプッシュします：
- `majikijima/todo-app-backend` - Djangoバックエンド
- `majikijima/todo-app-frontend` - Reactフロントエンド
- `majikijima/todo-app-nginx` - nginx設定

### ⚠️ 注意事項
- Repository Secretsが設定されていないとDocker Hub関連のジョブが失敗します
- アクセストークンは安全に管理し、必要に応じて定期的に更新してください
- 初回実行時はDocker Hubに自動でリポジトリが作成されます

### 📊 CI/CDパイプライン実行結果
現在のパイプラインでは以下の成果を達成しています：

#### ✅ テスト成功率
- **Django テスト**: 12/12 テスト成功
  - TaskModelTest: 4テスト（作成、表示、期限切れ判定、優先度分類）
  - TaskAPITest: 6テスト（CRUD操作、完了状態切り替え、フィルタ）
  - TaskFilterTest: 2テスト（完了・未完了フィルタ）
- **React テスト**: 7/7 テスト成功
  - App.test.js: 2テスト（レンダリング、基本機能）
  - TaskItem.test.js: 2テスト（表示、完了切り替え）
  - TaskForm.test.js: 3テスト（フォーム表示、入力、送信）

#### ✅ コード品質
- **Python**: Black, isort, flake8 によるコードスタイル統一
- **JavaScript**: ESLint による構文チェック・品質保証
- **Docker**: マルチステージビルドによる軽量イメージ作成

### ローカル開発でのコード品質チェック

```bash
# Python コードフォーマット
cd backend
pip install black isort flake8
black .
isort .
flake8 .

# JavaScript コードチェック
cd frontend
npm run build
```

## ✨ 機能

### 基本機能
- ✅ タスクの作成、編集、削除
- ✅ タスクの完了/未完了の切り替え
- ✅ タスクのフィルタリング（全て・未完了・完了）
- ✅ レスポンシブデザイン
- ✅ モダンなUI/UX
- ✅ リアルタイム更新

### アイゼンハウワーマトリクス機能
- ✅ **マトリクス表示**: 緊急度と重要度による4象限分類
- ✅ **ドラッグ&ドロップ**: タスクカードを象限間で移動
- ✅ **期限切れラベル**: 期限が過ぎたタスクに「期限切れ」バッジ表示
- ✅ **相対日付表示**: 今日・明日の期限を分かりやすく表示
- ✅ **視覚的分類**: 
  - **第1象限（すぐやる）**: 緊急 × 重要
  - **第2象限（計画的にやる）**: 重要 × 緊急ではない
  - **第3象限（委任する）**: 緊急 × 重要ではない
  - **第4象限（やらない）**: 緊急ではない × 重要ではない

### タスク管理詳細機能
- ✅ **期限設定**: 年月日・時刻指定、終日タスク対応
- ✅ **作業時間見積もり**: 15分〜120分の選択肢
- ✅ **優先度判定支援**: 緊急度・重要度の判断基準ガイド表示

## 📋 前提条件

- Docker
- Docker Compose

## 🔧 セットアップ

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/dkijima0105/todo-app.git
   cd todo-app
   ```

2. **Docker Composeでアプリケーションを起動**
   ```bash
   docker-compose up --build
   ```

3. **データベースのマイグレーション**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

4. **スーパーユーザーの作成（オプション）**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

## 🌐 アクセス

- **フロントエンド**: http://localhost:3000
- **Django管理画面**: http://localhost:8000/admin
- **API**: http://localhost:8000/api/

## 🎯 アイゼンハウワーマトリクス機能

このアプリケーションの核となる機能で、スティーブン・コヴィー博士の「7つの習慣」で紹介されたタスク管理手法を実装しています。

### 4つの象限

| 象限 | 分類 | 行動指針 | 特徴 |
|------|------|----------|------|
| 第1象限 | 緊急 × 重要 | **すぐやる** | 締切が近い重要なタスク |
| 第2象限 | 重要 × 緊急ではない | **計画的にやる** | 長期的な成果につながるタスク |
| 第3象限 | 緊急 × 重要ではない | **委任する** | 他人に任せられるタスク |
| 第4象限 | 緊急ではない × 重要ではない | **やらない** | 削除・延期を検討するタスク |

### 操作方法

#### 1. タスクの作成
- 「新しいタスクを追加」フォームでタスクを作成
- 緊急度・重要度を選択（判断基準ガイド付き）
- 期限・作業時間見積もりを設定

#### 2. マトリクス表示での操作
- **表示切り替え**: 「マトリクス表示」ボタンでマトリクス表示に切り替え
- **タスククリック**: タスクカードをクリックして詳細表示・編集
- **ドラッグ&ドロップ**: タスクカードを別の象限にドラッグして移動

#### 3. 期限管理
- **期限切れラベル**: 期限が過ぎたタスクに赤い「期限切れ」バッジ
- **相対日付表示**: 
  - 今日の期限 → 「今日」「今日 14:30」
  - 明日の期限 → 「明日」「明日 09:00」
  - その他 → 通常の日付表示

### 使い方のコツ

1. **第2象限を重視**: 重要だが緊急でないタスクに計画的に取り組む
2. **第1象限を減らす**: 事前の計画で緊急事態を防ぐ
3. **第3・4象限を最小化**: 重要でないタスクは委任・削除を検討
4. **定期的な見直し**: タスクの優先度を定期的に再評価

## 📁 プロジェクト構造

```
todo-app/
├── backend/                # Django REST Framework バックエンド
│   ├── taskmanager/       # プロジェクト設定
│   └── tasks/             # タスクアプリ
│       ├── models.py      # タスクモデル（緊急度・重要度・期限管理）
│       ├── serializers.py # API シリアライザー
│       └── views.py       # API ビュー
├── frontend/              # React フロントエンド
│   ├── src/
│   │   ├── components/    # Reactコンポーネント
│   │   │   ├── EisenhowerMatrix.js    # マトリクス表示・ドラッグ&ドロップ
│   │   │   ├── TaskForm.js            # タスク作成フォーム
│   │   │   ├── TaskList.js            # リスト表示
│   │   │   ├── TaskDetail.js          # タスク詳細
│   │   │   └── TaskItem.js            # タスクアイテム
│   │   ├── App.js         # メインアプリケーション
│   │   └── App.css        # スタイル（マトリクス・ドラッグ&ドロップ含む）
│   └── public/            # 静的ファイル
├── nginx/                 # nginx設定
└── docker-compose.yml     # Docker設定
```

## 🔌 API エンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/tasks/` | GET | タスク一覧取得（緊急度・重要度・期限情報含む） |
| `/api/tasks/` | POST | タスク作成（緊急度・重要度・期限設定対応） |
| `/api/tasks/{id}/` | GET | タスク詳細取得 |
| `/api/tasks/{id}/` | PUT/PATCH | タスク更新（ドラッグ&ドロップ対応） |
| `/api/tasks/{id}/` | DELETE | タスク削除 |
| `/api/tasks/{id}/toggle_completed/` | PATCH | 完了状態切り替え |
| `/api/tasks/completed/` | GET | 完了タスク一覧 |
| `/api/tasks/pending/` | GET | 未完了タスク一覧 |

### タスクデータ構造

```json
{
  "id": 1,
  "title": "タスクのタイトル",
  "description": "タスクの説明",
  "urgency": "urgent",           // "urgent" | "not_urgent"
  "importance": "important",     // "important" | "not_important"
  "due_date": "2024-07-15T14:30:00Z",
  "is_all_day": false,
  "estimated_hours": 2.0,
  "estimated_hours_display": "120分",
  "completed": false,
  "is_overdue": false,           // 自動計算される期限切れフラグ
  "created_at": "2024-07-13T10:00:00Z",
  "updated_at": "2024-07-13T10:00:00Z"
}
```

## 🛠️ 開発

### バックエンド開発

```bash
# Django開発サーバーを単体で起動
cd backend
pip install -r requirements.txt
python manage.py runserver

# マイグレーション作成
python manage.py makemigrations

# マイグレーション適用
python manage.py migrate
```

### フロントエンド開発

```bash
# React開発サーバーを単体で起動
cd frontend
npm install
npm start
```

## 🎨 デザイン特徴

- **グラデーション背景**: 美しいプルーグラデーション
- **グラスモーフィズム**: 半透明でぼかし効果のあるカード
- **アニメーション**: ホバー効果とスムーズなトランジション
- **レスポンシブ**: モバイルフレンドリーなデザイン

## 📱 レスポンシブ対応

このアプリケーションは、デスクトップからモバイルまで様々なデバイスに対応したレスポンシブデザインを採用しています。

### ブレークポイント

- **デスクトップ**: 1367px以上
- **タブレット・モバイル**: 1366px以下

### デバイス別UI

#### デスクトップ（1367px以上）
- **3カラムレイアウト**: タスク表示エリア、タスク詳細エリア、タスク作成フォーム
- **サイドパネル**: 右側にタスク作成フォームを常時表示
- **ホバー効果**: マウスオーバー時のインタラクション
- **インライン詳細**: タスククリック時に詳細パネルを表示

#### タブレット・モバイル（1366px以下）
- **1カラムレイアウト**: コンテンツを縦に配置
- **モーダル表示**: タスク詳細とタスク作成をモーダルで表示
- **タッチフレンドリー**: 44px以上のタッチターゲット
- **統一UI要素**:
  - タスク追加ボタン（表示エリア下部に固定）
  - フルスクリーンモーダル（タスク作成・編集用）
  - タスク詳細モーダル（タスククリック時）
  - スワイプ対応のスクロール

### タブレット・モバイル最適化

- **レスポンシブモーダル**: デバイスサイズに応じたモーダル表示
- **タッチターゲット**: 最小44x44pxのボタンサイズ
- **フォントサイズ調整**: 16px以上でズーム防止（モバイル）
- **画面専有**: タスク作成・詳細フォームがモーダルで表示
- **片手操作**: 重要なボタンを下部に配置
- **キーボード対応**: 入力時の画面調整
- **縦横対応**: 縦表示・横表示両方でモーダル動作
- **タブレット対応**: 大きな画面でも使いやすいモーダルサイズ

## 🔧 カスタマイズ

### 環境変数

- `REACT_APP_API_URL`: APIのベースURL（デフォルト: http://localhost:8000）
- `DEBUG`: Djangoのデバッグモード
- `DATABASE_URL`: データベース接続URL

### スタイルの変更

フロントエンドのスタイルは `frontend/src/App.css` で調整できます。

#### 主要なCSSクラス
- `.eisenhower-matrix`: マトリクス全体のレイアウト
- `.matrix-quadrant`: 各象限のスタイル
- `.matrix-task`: タスクカードのスタイル
- `.matrix-task.dragging`: ドラッグ中のタスクカード
- `.overdue-badge`: 期限切れバッジ
- `.drag-over`: ドラッグオーバー時の象限ハイライト

### 機能のカスタマイズ

#### 1. 相対日付表示の変更
`EisenhowerMatrix.js` の `formatDate` 関数で日付表示形式を変更できます。

#### 2. ドラッグ&ドロップの動作調整
- ドラッグ時の視覚効果: `.matrix-task.dragging` CSSクラス
- ドロップゾーンのハイライト: `.drag-over` CSSクラス

#### 3. 象限の表示内容変更
各象限のヘッダーテキストやスタイルは `EisenhowerMatrix.js` で変更できます。

## 🛠️ トラブルシューティング

### よくある問題と解決法

1. **ドラッグ&ドロップが動作しない**
   - ブラウザのキャッシュをクリア
   - Docker コンテナの再起動: `docker-compose restart frontend`

2. **期限切れラベルが正しく表示されない**
   - サーバーとクライアントの時刻設定を確認
   - タイムゾーン設定を確認

3. **タスクが象限間で移動できない**
   - ネットワーク接続を確認
   - ブラウザの開発者ツールでAPIエラーを確認

4. **コンパイルエラーが発生する**
   ```bash
   # ESLint警告を確認
   docker-compose logs frontend
   
   # 未使用変数やインポートを削除
   # frontend/src/components/ 内のファイルを確認
   ```

## 📈 更新履歴

### v2.0.0 - アイゼンハウワーマトリクス実装 (2024-07)
- ✨ **新機能**: アイゼンハウワーマトリクス表示機能
- ✨ **新機能**: ドラッグ&ドロップによる象限間移動
- ✨ **新機能**: 期限切れラベル表示
- ✨ **新機能**: 相対日付表示（今日・明日）
- 🎨 **UI改善**: タスク作成フォームの緊急度・重要度判断ガイド
- 🐛 **バグ修正**: レスポンシブレイアウトの最適化
- 🐛 **バグ修正**: ESLint警告の解消

### v1.0.0 - 基本機能 (2024-06)
- ✨ 基本的なタスク管理機能（CRUD）
- ✨ リスト表示機能
- ✨ レスポンシブデザイン
- ✨ Docker環境構築

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 貢献

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesを使用してください。 