/*
  이런 함수들을 왜 만드는 것인가?
  - generic 다형성 있는 함수를 제공할 수 있다!
*/

const test = (a: number) => a;
const res = test(2);

// 타입 매개변수 T를 받고,
// extends(부분집합) : 아래와 같은 코드가 있을 때 T는 number의 부분집합이란 의미를 갖고 있다.
// 그래서 아래와 같은 코드에서 T에는 숫자 타입만 넣을 수 있게 되는 것이다.
type Test<T extends number> = T;

type C1 = Test<[1, 2, 3, 4]>; // Number[] 타입이기 때문에 잘못됨
type C2 = Test<30>; // 일반적인 숫자형태 타입이기 때문에 OK

// ------------------------------------------------------
// 반환하는 값에 삼항연산자를 넣어 로직을 만들 수 있다. if가 아닌 extends 활용 가능
// 만약 받은 인자 T 값이 2라면, 3을 반환하고 아니라면 4 반환
type Test2<T extends number> = T extends 2 ? true : false;

type C3 = Test2<65>; // false -> 받은 인자가 2가 아니기 때문에 false
type C4 = Test2<2>; // true -> 받은 인자가 2이기 때문에 true

// ------------------------------------------------------
// 가장 맨 처음 원소를 뱉게 되는 타입 만들어보기
// 원소가 없다면 undefined 반환
// T가 extends 뒷쪽 형태라면 가장 맨 앞 원소인 A 반환하고, 해당 형태가 아니라면 undefined 반환
type Head<T extends any[]> = T extends [infer A, ...any[]] ? A : undefined;

type H1 = Head<[4, 1, 2, 3]>; // 4
type H2 = Head<[]>; // undefined

// ------------------------------------------------------
// 위 형태처럼 type, type 일일이 써가며 확인하는 게 귀찮기 때문에
// 타입 체커 만들어보기!

// A가 B의 부분집합인 경우 1을 반환하고 아니라면 0
// 그리고 1인 경우에는 B가 A의 부분집합인지도 확인하여 1 반환, 아니라면 0 반환
type Equal<A, B> = A extends B ? (B extends A ? 1 : 0) : 0;

type E0 = Equal<1, 1>; // 1
type E1 = Equal<1, 2>; // 0
// E3의 경우 A는 1 B는 1|2다
// 1은 1|2 의 부분집합이라 1을 반환하지만, 다시 1|2가 1인지 확인할때는 부분집합이 아니기 때문에 0
// 즉, Equal<1, 1|2>는 1이 1|2에 포함되므로 1이 될 수도 있고, 1|2가 1에 포함되지 않기때문에 0이 될 수도 있다.
type E3 = Equal<1, 1 | 2>; // 0 | 1

// declare 사용하면 로직을 구현하지 않아도 함수를 사용할 수 있다!
const Pass = 1;
const Fail = 0;
declare function check<A, B>(params: Equal<Equal<A, B>, typeof Pass>): void;

check<1, 2>(Pass);
check<1, 2>(Fail);
check<Head<[1, 2, 3, 4]>, 1>(Pass);
check<Head<[]>, undefined>(Pass);
check<Head<[3, 1, 2]>, 1>(Fail);

// ------------------------------------------------------
// 길이 체커
type Length<T extends any[]> = T["length"];
check<Length<[1, 2, 3, 4]>, 4>(Pass);

// 뒤 인자가 있다면 true 없다면 false 반환하는 체커함수
type HasTail<T extends any[]> = Length<T> extends 0 ? false : true;
check<HasTail<[1, 2, 3]>, true>(Pass);
check<HasTail<[3]>, true>(Pass);
check<HasTail<[]>, true>(Fail);
check<HasTail<[]>, false>(Pass);

// 첫 번째 인자를 제외한 나머지 요소 반환
type Tail<T extends any[]> = T extends [any, ...infer A] ? A : [];
check<Tail<[1, 2, 3, 4]>, [2, 3, 4]>(Pass);
check<Tail<[1, 2, 3, 4]>, [1]>(Fail);
check<Tail<[4]>, []>(Pass);
check<Tail<[]>, []>(Pass);

// 마지막 인자만 반환하는 함수
// ts generic에서는 앞에도 스프레드 문법 사용 가능!
type Last<T extends any[]> = T extends [...any[], infer A] ? A : undefined;
check<Last<[1, 2, 3, 4]>, 4>(Pass);
check<Last<[1, 2, 3, 4]>, 1>(Fail);
check<Last<[4]>, 4>(Pass);
check<Last<[]>, undefined>(Pass);

// 배열 '앞'에 새로운 인자를 추가하는 검증 함수
type Prepend<T extends any[], E> = [E, ...T];
check<Prepend<[3, 4, 5], 2>, [2, 3, 4, 5]>(Pass);
check<Prepend<[], 1>, [1]>(Pass);

// 배열 '뒤'에 새로운 인자를 추가하는 검증 함수
type Append<T extends any[], E> = [...T, E];
check<Append<[1, 2, 3], 4>, [1, 2, 3, 4]>(Pass);
check<Append<[1], 2>, [1]>(Fail);
// -아래 활용한 Concat으로도 만들 수 있음
// type Append<T extends any[], E> = Concat<T, [E]>

// 배열 T에서 앞 N개의 요소를 빼는 함수 | P는 뺀 요소들을 보관할 용도
// 아래 패턴 사용할 예정!
// 재귀패턴 아주 잘 사용되는 요소임!!
// const a = {'0': 1 as const}['0']; -> a: 1
type Drop<N, T extends any[], P extends any[] = []> = {
  0: T; // 요소를 전부 제거해서 P에 그만큼 길이가 되었다면 바로 T 반환 -> 요소가 빠진 배열이 반환됨
  1: Drop<N, Tail<T>, Prepend<P, any>>;
}[Length<P> extends N ? 0 : 1]; // N개 만큼 빼기 때문에 P의 길이를 확인하기 위함

check<Drop<0, [1, 2, 3, 4]>, [1, 2, 3, 4]>(Pass);
check<Drop<1, [1, 2, 3, 4]>, [1, 2, 3, 4]>(Pass); // [2, 3, 4]여야 하는데 지금 [1, 2, 3, 4]로 해놔서 Fail이어야 함!
check<Drop<1, [1, 2, 3, 4]>, [1, 2, 3, 4]>(Fail);
check<Drop<3, [1, 2, 3, 4]>, [4]>(Pass);
check<Drop<5, [1, 2, 3, 4]>, []>(Pass);
check<Drop<4, [1, 2, 3, 4]>, []>(Pass);

// 배열을 반대로 만드는 함수
type Reverse<T extends any[], P extends any[] = []> = {
  0: P;
  1: Reverse<Tail<T>, Prepend<P, Head<T>>>; // 재귀로 우선 돌리기 -> T는 꼬리부터 하나씩 제거하고 | P에는 T의 가장 앞 원소 추출하여 넣기 (앞부터 추가됨)
}[Length<T> extends 0 ? 0 : 1];

check<Reverse<[1, 2, 3, 4]>, [4, 3, 2, 1]>(Pass);

type Concat<T extends any[], E extends any[]> = [...T, ...E];

check<Concat<[1], [2]>, [1, 2]>(Pass);

// ------------------------------------------------------
// ------------------------------------------------------
// ------------------------------------------------------
// string 유틸 함수

// 배열과 구분자 string원소를 받아 이어주는 함수
type Join<T extends any[], S extends string> = Length<T> extends 0
  ? ""
  : Length<T> extends 1
  ? `${T[0]}`
  : `${T[0]}${S}${Join<Tail<T>, S>}`;
check<Join<[1, 2, 3, 4, 5], ",">, "1,2,3,4,5">(Pass);
check<Join<[1], ",">, "1">(Pass);
check<Join<[], ",">, "">(Pass);

// 문자들을 받고, A 문자를 B 문자로 변환해보기
type Replace<
  T extends string,
  A extends string,
  B extends string
> = T extends `${infer P1}${A}${infer P2}`
  ? Replace<`${P1}${B}${P2}`, A, B>
  : T;

check<Replace<"abcdfff", "f", "c">, "abcdccc">(Pass);
check<Replace<"apple", "a", "b">, "apple">(Pass); // bpple이어야 하는데 Pass로 취급하여 현재 타입스크립트 에러 -> Fail이 정답
check<Replace<"apple", "a", "b">, "cpple">(Fail);

// 문자열과 구분자를 받아, 구분자에 따라 문자를 나눠주는 함수
type Split<
  T extends string,
  E extends string,
  P extends any[] = []
> = T extends `${infer A}${E}${infer B}`
  ? Split<B, E, Append<P, A>>
  : Append<P, T>;

check<Split<"aabb,cc,dd", ",">, ["aabb", "cc", "dd"]>(Pass);

// 배열을 받아, 겹배열 요소들을 풀어주는 역할
// 배열이 몇 번 벗겨지는지 체크가 필수!

// -1인 이유! -> 타입에서는 뺄셈 연산이 지원되지 않는다.
// 그래서 트릭을 사용하게 되는데,
/* 
  const arr = [1, 2, 3, 4, 5][0] // 1
  const arr = [1, 2, 3, 4, 5][1] // 2

  const arr = [-1, 0, 1, 2, 3, 4, 5][1] // 0
  const arr = [-1, 0, 1, 2, 3, 4, 5][2] // 1
  이런 index를 활용한 트릭을 사용할 예정!
*/
// 뭔소리냐 이거 ;;
type Flat<T, N extends number = 1> = {
  0: T; // N만큼 배열을 벗겼다면 이제 그만 T반환
  1: T extends Array<infer A> ? Flat<A, [-1, 0, 1, 2, 3, 4, 5, 6, 7][N]> : T;
}[N extends -1 ? 0 : 1];

check<Flat<[1, 2, 3, [4]], 1>, 1 | 2 | 3 | 4>(Pass);
check<Flat<[1, 2, 3, [[4]]], 1>, 1 | 2 | 3 | [4]>(Pass);
check<Flat<[1, 2, 3, [[4]]], 2>, 1 | 2 | 3 | 4>(Pass);
check<Flat<[1, 2, [3, [4]]], 1>, 1 | 2 | 3 | [4]>(Pass);
check<Flat<[1, 2, [3, [4]]], 2>, 1 | 2 | 3 | 4>(Pass);

declare function flatFunc<T, N extends number = 1>(arr: T, n?: N): Flat<T, N>[];

const flatArr1 = flatFunc([1, 2, 3, [4]]); // 1차배열 (N default가 1로 설정되어 있기 때문에)
const flatArr2 = flatFunc([1, 2, 3, [[4]]]); // 2차배열
const flatArr3 = flatFunc([1, 2, 3, [[4]]], 2); // 1차배열

// ------------------------------------------------------
// ------------------------------------------------------
// ------------------------------------------------------
// TODO : 남은 추가 정리도 필요 ..
