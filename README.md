# GogoTaxi Backend

GogoTaxi Backend는 택시 동승 서비스의 인증, 방 관리, 실시간 상태 공유, 지갑/결제, 정산, 영수증 분석, 리뷰/신고, 알림 기능을 제공하는 Node.js API 서버입니다. Express 5와 Prisma ORM을 기반으로 PostgreSQL에 데이터를 저장하며, Socket.IO를 통해 방 상태 변경을 실시간으로 클라이언트에 전파합니다.

## 프로젝트 목표

- 택시 동승 방 생성, 참여, 퇴장, 상태 변경을 안정적으로 처리
- JWT Access/Refresh Token 기반 인증 세션 제공
- Kakao/Google OAuth 로그인 및 추가 동의 플로우 지원
- 예상 요금 선차감, 실제 요금 확정, 추가 징수/환불을 포함한 정산 로직 구현
- Gemini Vision 기반 영수증/배차 스크린샷 분석 연동
- Socket.IO 기반 방 단위 실시간 업데이트 제공
- Render, Docker, PostgreSQL 환경에서 배포 가능한 구조 제공

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Runtime | Node.js 20+ / 22+ |
| Language | TypeScript |
| Server | Express 5 |
| Database | PostgreSQL |
| ORM | Prisma 6 |
| Auth | JWT, bcrypt |
| Validation | Zod |
| Realtime | Socket.IO |
| Security | Helmet, CORS, rate limiter |
| Logging | Pino, pino-http |
| File Upload | Multer |
| AI Vision | Google Gemini API |
| Scheduler | node-cron |
| Deployment | Docker, Render |

## 주요 기능

### 인증

- 일반 회원가입 및 로그인
- bcrypt 기반 비밀번호 해싱
- Access Token과 Refresh Token 분리
- Refresh Token DB 저장 및 해시 기반 검증
- 로그아웃 시 Refresh Token 폐기
- Kakao OAuth redirect flow
- Google/Kakao token 기반 소셜 로그인
- 소셜 로그인 신규 사용자 약관 동의 완료 API
- `/api/me`, `/api/auth/me` 프로필 조회 지원

### 방 관리

- 방 생성, 목록 조회, 내 방 조회, 매칭 조회
- 방 상세 조회
- 출발지/도착지 좌표, 출발 시간, 정원, 우선순위, 예상 요금 저장
- 방 참여/퇴장 및 좌석 번호 관리
- 정원 도달 시 상태 갱신
- 방 상태 변경 시 Socket.IO 이벤트 전파

### 호출 및 배차 상태

- Uber deeplink 생성
- 방 단위 ride state 저장
- 호출 요청, 단계 변경, 상태 조회
- 배차 스크린샷을 Gemini Vision으로 분석해 기사명/차량 번호/차량 모델 추출
- 배차 정보 분석 후 방 상태와 정산 선차감 플로우에 연결

### 지갑 및 결제

- 사용자별 지갑 잔액 관리
- 충전, 차감, 환불, 조정 트랜잭션 기록
- idempotency key로 중복 트랜잭션 방지
- Mock payment session 생성/확정/실패 처리
- 결제 성공 이벤트를 지갑 거래로 반영
- 잔액 부족 시 자동 충전 옵션 지원

### 정산

- 예상 요금 기준 참가자별 선차감
- 실제 요금 확정 후 차액 계산
- 추가 징수/환불 금액 분배
- host/guest 역할별 정산 레코드 생성
- 정산 완료 시 RideHistory 생성
- 정산 결과를 방 상세와 목록에 실시간 반영

### 영수증 및 AI 분석

- 이미지 base64 payload 수신
- Gemini Vision으로 영수증 총액, 통화, 항목, raw text 분석
- KRW 영수증만 정산 처리
- 영수증 분석 결과를 `hold` 또는 `finalize` 액션에 연결
- 배차 스크린샷에서 운전자/차량 정보를 추출하는 별도 분석 기능 제공

### 리뷰, 신고, 알림, 이용 내역

- 탑승 완료 후 방 단위 리뷰 작성/조회
- 참여자가 문제 사용자를 신고
- 사용자별 알림 목록 조회
- 정산 완료 탑승 내역 조회
- 공지/알림 데이터 조회

## 디렉터리 구조

```text
src/
  config/              환경 변수, CORS 설정
  controllers/         방/호출 컨트롤러
  lib/                 Prisma, JWT, Socket.IO 초기화
  middlewares/         인증, 보안, 에러 처리
  modules/
    auth/              회원가입, 로그인, OAuth, 토큰 갱신
    notifications/     알림 조회/발송
    payments/          mock 결제, OCR 결제 추정, 결제 이벤트
    report/            신고
    review/            리뷰
    ride/              배차 스크린샷 분석
    rideHistory/       이용 내역, 영수증 분석
    settlement/        요금 선차감/확정 정산
    wallet/            지갑 잔액과 거래 기록
  routes/              API 라우터 조합
  index.ts             Express 앱, HTTP 서버, Socket.IO 부트스트랩
prisma/
  schema.prisma        데이터 모델
  migrations/          DB 마이그레이션
```

## 서버 구조

`src/index.ts`에서 Express 앱을 구성합니다.

- `helmet()`으로 기본 보안 헤더 적용
- CORS origin을 `config/cors.ts`의 허용 규칙으로 검증
- multipart 요청을 제외한 raw body를 직접 파싱해 JSON, form-urlencoded, raw text 입력에 대응
- `pino-http`로 HTTP 요청 로깅
- in-memory rate limiter로 IP당 1분 120회 요청 제한
- `/health` 헬스체크 제공
- `/api` 하위에 도메인 라우터 연결
- HTTP server 위에 Socket.IO 초기화

## 데이터 모델

Prisma schema의 핵심 모델은 다음과 같습니다.

| 모델 | 역할 |
| --- | --- |
| `User` | 사용자 계정, 프로필, 지갑 잔액 |
| `SocialAccount` | Kakao/Google 소셜 계정 연결 |
| `RefreshToken` | Refresh Token 해시, 만료, 폐기 상태 |
| `Room` | 택시 동승 방, 경로, 상태, 예상/실제 요금 |
| `RoomParticipant` | 방 참여자와 좌석 번호 |
| `RoomRideState` | 호출/배차 진행 단계와 기사/차량 정보 |
| `DispatchedTaxi` | 배차된 택시 정보 |
| `WalletTransaction` | 지갑 충전/차감/환불/조정 거래 |
| `RoomSettlement` | 방별 사용자 정산 결과 |
| `RideHistory` | 정산 완료 후 생성되는 이용 내역 |
| `Review` | 방 단위 리뷰 |
| `Report` | 방 단위 신고 |
| `Notice` | 공지/알림 데이터 |

주요 enum은 `RoomStatus`, `RoomRideStage`, `SettlementStatus`, `WalletTxKind`, `SettlementRole`, `AuthProvider`입니다.

## API 요약

모든 경로는 기본적으로 `/api` prefix를 사용합니다. 인증이 필요한 API는 `Authorization: Bearer <accessToken>` 헤더가 필요합니다.

### Health

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/health` | 서버 상태 확인 |
| `GET` | `/api/health` | API 라우터 상태 확인 |

### Auth

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | 일반 회원가입 |
| `GET` | `/api/auth/check-id` | 로그인 ID 중복 확인 |
| `POST` | `/api/auth/login` | 로그인 |
| `POST` | `/api/auth/refresh` | Access/Refresh Token 재발급 |
| `POST` | `/api/auth/logout` | Refresh Token 폐기 |
| `GET` | `/api/auth/me` | 인증 사용자 조회 |
| `GET` | `/api/auth/social/kakao/start` | Kakao OAuth 시작 |
| `GET` | `/api/auth/social/kakao/callback` | Kakao OAuth callback |
| `POST` | `/api/auth/social/login` | Kakao/Google 소셜 로그인 |
| `POST` | `/api/auth/social/consent` | 소셜 신규 사용자 동의 완료 |
| `GET` | `/api/me` | 내 프로필 조회 |
| `PATCH` | `/api/me` | 내 프로필 수정 |
| `PATCH` | `/api/me/password` | 비밀번호 변경 |

### Rooms

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/api/rooms` | 방 생성 |
| `GET` | `/api/rooms` | 방 목록 조회 |
| `GET` | `/api/rooms/match` | 조건 기반 매칭 방 조회 |
| `GET` | `/api/rooms/mine` | 내가 참여/생성한 방 조회 |
| `GET` | `/api/rooms/:id` | 방 상세 조회 |
| `PATCH` | `/api/rooms/:id` | 방 정보 수정 |
| `POST` | `/api/rooms/:id/join` | 방 참여 및 좌석 선택 |
| `POST` | `/api/rooms/:id/leave` | 방 퇴장 |

### Ride

| Method | Path | 설명 |
| --- | --- | --- |
| `GET/POST` | `/api/rides/uber/deeplink` | Uber deeplink 생성 |
| `GET` | `/api/rooms/:id/ride-state` | 방 호출 상태 조회 |
| `POST` | `/api/rooms/:id/ride/request` | 방 호출 요청 |
| `POST` | `/api/rooms/:id/ride/stage` | 호출 단계 변경 |
| `POST` | `/api/rooms/:id/ride/dispatch-info` | 배차 스크린샷 분석 |

### Wallet & Payments

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/api/wallet/balance` | 지갑 잔액 조회 |
| `POST` | `/api/wallet/topup` | 지갑 충전 |
| `POST` | `/api/wallet/charge` | 지갑 차감/환불 거래 생성 |
| `POST` | `/api/wallet/receipt/amount` | 입금/결제 화면 이미지 금액 분석 |
| `GET` | `/api/payments/mock` | mock 결제 목록 |
| `GET` | `/api/payments/mock/sessions` | 사용자 mock 결제 세션 목록 |
| `POST` | `/api/payments/mock/session` | mock 결제 세션 생성 |
| `POST` | `/api/payments/mock/session/:sessionId/confirm` | mock 결제 성공 처리 |
| `POST` | `/api/payments/mock/session/:sessionId/fail` | mock 결제 실패 처리 |
| `POST` | `/api/payments/mock/charge` | mock 즉시 결제 |
| `POST` | `/api/payments/mock/refund` | mock 환불 |
| `POST` | `/api/payments/mock/webhook` | mock webhook 처리 |
| `POST` | `/api/payments/ocr/estimate` | OCR 기반 결제 금액 추정 |

### Settlement

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/api/settlements/rooms/:roomId/hold` | 예상 요금 선차감 |
| `POST` | `/api/settlements/rooms/:roomId/finalize` | 실제 요금 기반 정산 확정 |
| `POST` | `/api/settlements/rooms/:roomId/finalize/receipt` | 영수증 분석 후 정산 확정 |
| `POST` | `/api/receipts/analyze` | 영수증 분석 및 선택적 정산 액션 |

### 기타 도메인

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/api/rides/history` | 이용 내역 조회 |
| `POST` | `/api/reviews` | 리뷰 작성 |
| `GET` | `/api/reviews/room/:roomId` | 특정 방 리뷰 조회 |
| `GET` | `/api/reviews/me` | 내가 작성한 리뷰 조회 |
| `POST` | `/api/reports` | 신고 작성 |
| `GET` | `/api/reports/room/:roomId` | 특정 방 신고 조회 |
| `GET` | `/api/reports/me` | 내가 작성한 신고 조회 |
| `GET` | `/api/notifications` | 사용자 알림 조회 |
| `POST` | `/api/notifications/test` | 테스트 알림 생성 |

세부 요청/응답 스키마는 각 모듈의 `dto.ts`, `routes.ts`, `service.ts`에 정의되어 있습니다.

## Socket.IO 이벤트

### Client to Server

| Event | Payload | 설명 |
| --- | --- | --- |
| `room:subscribe` | `roomId: string` | 특정 방 채널 구독 |
| `room:join` | `roomId: string` | `room:subscribe` alias |
| `room:unsubscribe` | `roomId: string` | 특정 방 채널 구독 해제 |
| `room:leave` | `roomId: string` | `room:unsubscribe` alias |

### Server to Client

| Event | Payload | 설명 |
| --- | --- | --- |
| `room:subscribed` | `{ roomId }` | 구독 완료 |
| `room:unsubscribed` | `{ roomId }` | 구독 해제 완료 |
| `room:update` | room payload | 방 상세 상태 변경 |
| `room:closed` | `{ roomId }` | 방 종료 |
| `rooms:refresh` | `{ roomId, reason, at }` | 목록 새로고침 필요 |

## 환경 변수

`.env` 또는 배포 환경 변수로 설정합니다.

| 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `NODE_ENV` | 실행 환경 | `development` |
| `PORT` | 서버 포트 | `8080` |
| `DATABASE_URL` | PostgreSQL 연결 문자열 | 없음 |
| `JWT_SECRET` | Access Token 서명 키 | `dev` |
| `JWT_REFRESH_SECRET` | Refresh Token 서명 키 | `JWT_SECRET` |
| `JWT_EXPIRES_IN` | 기존 access token 만료 fallback | `7d` |
| `JWT_ACCESS_EXPIRES_IN` | Access Token 만료 시간 | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh Token 만료 시간 | `14d` |
| `CORS_ORIGINS` | 허용 origin 목록 | 빈 문자열 |
| `BCRYPT_SALT_ROUNDS` | bcrypt salt rounds | `10` |
| `KAKAO_REST_API_KEY` | Kakao OAuth REST API 키 | 없음 |
| `KAKAO_ADMIN_KEY` | Kakao Admin 키 | 없음 |
| `KAKAO_JS_KEY` | Kakao JS 키 | 없음 |
| `KAKAO_REDIRECT_URI` | Kakao OAuth callback URL | 없음 |
| `KAKAO_CLIENT_SECRET` | Kakao client secret | 없음 |
| `SOCIAL_CONSENT_REDIRECT_URI` | 소셜 동의 프론트 URL | 없음 |
| `SOCIAL_LOGIN_SUCCESS_REDIRECT_URI` | 소셜 로그인 성공 프론트 URL | 없음 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | 없음 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | 없음 |
| `UBER_CLIENT_ID` | Uber deeplink/client ID | 없음 |
| `GEMINI_API_KEY` | Gemini API key | 없음 |
| `GEMINI_MODEL` | Gemini 모델명 | 없음 |
| `GEMINI_API_VERSION` | Gemini API 버전 | 없음 |
| `AUTO_TOP_UP_ENABLED` | 잔액 부족 시 자동 충전 여부 | `false` |
| `PAYMENTS_MOCK_WEBHOOK_SECRET` | mock webhook secret | `mock-secret` |

## 실행 방법

### 1. 의존성 설치

```sh
npm install
```

### 2. PostgreSQL 실행

로컬 개발용 Docker Compose가 포함되어 있습니다.

```sh
docker compose up -d
```

기본 DB 정보는 다음과 같습니다.

```text
host: localhost
port: 6543
database: gogotaxi
user: postgres
password: postgres
```

예시 `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:6543/gogotaxi?schema=public"
```

### 3. Prisma Client 생성

```sh
npx prisma generate
```

### 4. DB 마이그레이션 적용

```sh
npx prisma migrate dev
```

배포 환경에서는 다음 명령을 사용합니다.

```sh
npx prisma migrate deploy
```

### 5. 개발 서버 실행

```sh
npm run dev
```

기본 서버 주소는 `http://localhost:8080`입니다.

### 6. 빌드

```sh
npm run build
```

`npm run build`는 `prisma generate` 후 TypeScript를 `dist/`로 컴파일합니다.

### 7. 프로덕션 실행

```sh
npm start
```

## Docker

백엔드 Dockerfile은 Node 20 Alpine 기반이며, bcrypt/Prisma 빌드에 필요한 `openssl`, `python3`, `make`, `g++`를 설치합니다.

```sh
docker build -t gogotaxi-back .
docker run --env-file .env -p 8080:8080 gogotaxi-back
```

주의: Dockerfile의 `EXPOSE`는 3000으로 되어 있지만 애플리케이션 기본 포트는 `PORT` 환경 변수 또는 8080입니다. 컨테이너 실행 시 실제 `PORT`와 포트 매핑을 맞춰야 합니다.

## Render 배포

`render.yaml`에는 다음 흐름이 정의되어 있습니다.

- build: `npm ci --include=dev && npm run build`
- start: `npx prisma migrate deploy && npm start`
- health check: `/health`
- Node version: `22.12.0`
- 주요 secret은 Render 환경 변수로 주입

## 보안 및 안정성 포인트

- JWT Access/Refresh Token 분리로 짧은 access 만료와 세션 갱신을 동시에 지원
- Refresh Token은 원문이 아닌 해시로 DB에 저장
- `requireAuth` middleware가 Authorization header, cookie, custom header, query token fallback을 처리
- Zod DTO로 request payload 검증
- Helmet 적용
- CORS origin allow-list 처리
- IP 기준 in-memory rate limiter 적용
- 지갑 거래에 idempotency key를 적용해 중복 차감 방지
- 정산 API에서 방장 권한 확인 후 최종 정산 수행

## 포트폴리오 기술 포인트

- Express + Prisma 기반 모듈형 API 설계
- JWT access/refresh session과 DB 기반 token revocation 구현
- Socket.IO room channel을 활용한 실시간 방 상태 브로드캐스트
- 택시 동승 도메인에 맞춘 정산 알고리즘 구현: 예상 요금 hold, 실제 요금 finalize, 추가 징수/환불 분배
- Gemini Vision을 영수증/배차 스크린샷 분석에 적용해 수동 입력 비용 절감
- Prisma schema로 사용자, 방, 참여자, 지갑 거래, 정산, 이용 내역의 관계 모델링
- Render 배포 설정, Dockerfile, Docker Compose를 포함한 운영 환경 고려
- Zod validation, rate limiting, CORS, Helmet 등 API 안정성 장치 적용
