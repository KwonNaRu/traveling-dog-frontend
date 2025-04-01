"use client";

import { useState } from "react";
import styles from "./SearchSection.module.scss";
import { useForm } from "react-hook-form";
import { usePlanStore } from "@/store/plan";
import { useRouter } from "next/navigation";

type SearchFormInputs = {
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  budget: string;
  travelStyle: string;
  accommodation: string;
  interests: string;
  season: string;
  transportation: string;
};

export default function SearchSection() {
  const { createPlan } = usePlanStore();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<SearchFormInputs>({
    mode: "onChange",
    defaultValues: {
      country: "",
      city: "",
      startDate: "",
      endDate: "",
      budget: "",
      travelStyle: "",
      accommodation: "",
      interests: "",
      season: "",
      transportation: "",
    },
  });

  // 시작일 값 감시
  const startDate = watch("startDate");

  // 시작일이 변경될 때 종료일 검증
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;

    // 종료일이 새 시작일보다 이전이면 종료일 리셋
    const currentEndDate = watch("endDate");
    if (currentEndDate && currentEndDate < newStartDate) {
      setValue("endDate", "");
    }
  };

  const onSubmit = async (data: SearchFormInputs) => {
    const planList = JSON.parse(localStorage.getItem("planList") || "[]");
    console.log("일정 만들기:", data);
    const plan = await createPlan({
      title: data.country + " / " + data.city,
      country: data.country,
      city: data.city,
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      travelStyle: data.travelStyle,
      accommodation: data.accommodation,
      interests: data.interests,
      season: data.season,
      transportation: data.transportation,
    });
    // 여기에 일정 만들기 로직 구현
    planList.push(plan);
    localStorage.setItem("planList", JSON.stringify(planList));
    router.push(`/travel-plan/${plan.id}`);
  };

  return (
    <div className={styles.searchSection}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles.searchBox}
        data-testid="search-box"
      >
        <input
          type="text"
          placeholder="여행 국가를 입력하세요 (예: 미국, 일본)"
          className={`${styles.textInput} ${errors.country ? styles.inputError : ""}`}
          {...register("country", { required: true })}
        />
        {errors.country && (
          <p className={styles.errorText}>여행 국가를 입력해주세요</p>
        )}
        <input
          type="text"
          placeholder="여행 도시를 입력하세요 (예: 서울, 파리)"
          className={`${styles.textInput} ${errors.city ? styles.inputError : ""}`}
          {...register("city", { required: true })}
        />
        {errors.city && (
          <p className={styles.errorText}>여행 도시를 입력해주세요</p>
        )}

        <input
          type="date"
          className={`${styles.dateInput} ${errors.startDate ? styles.inputError : ""}`}
          placeholder="출발일"
          min={new Date().toISOString().split("T")[0]}
          {...register("startDate", {
            required: true,
            onChange: handleStartDateChange,
          })}
        />
        {errors.startDate && (
          <p className={styles.errorText}>출발일을 선택해주세요</p>
        )}

        <input
          type="date"
          className={`${styles.dateInput} ${errors.endDate ? styles.inputError : ""}`}
          placeholder="도착일"
          min={startDate || new Date().toISOString().split("T")[0]}
          max={
            startDate
              ? new Date(
                  new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000
                )
                  .toISOString()
                  .split("T")[0]
              : undefined
          }
          disabled={!startDate}
          {...register("endDate", { required: true })}
        />
        {errors.endDate && (
          <p className={styles.errorText}>도착일을 선택해주세요</p>
        )}

        <input
          type="text"
          className={`${styles.textInput} ${errors.budget ? styles.inputError : ""}`}
          placeholder="예산"
          {...register("budget", { required: true })}
        />
        {errors.budget && (
          <p className={styles.errorText}>예산을 입력해주세요</p>
        )}

        <input
          type="text"
          className={`${styles.textInput} ${errors.travelStyle ? styles.inputError : ""}`}
          placeholder="여행 스타일(힐링, 맛집 탐방, 명소 방문, 지역 축제)"
          {...register("travelStyle", { required: true })}
        />
        {errors.travelStyle && (
          <p className={styles.errorText}>여행 스타일을 입력해주세요</p>
        )}

        <input
          type="text"
          className={`${styles.textInput} ${errors.accommodation ? styles.inputError : ""}`}
          placeholder="숙박 유형(호텔, 모텔, 펜션)"
          {...register("accommodation", { required: true })}
        />
        {errors.accommodation && (
          <p className={styles.errorText}>숙박 유형을 입력해주세요</p>
        )}

        <input
          type="text"
          className={`${styles.textInput} ${errors.interests ? styles.inputError : ""}`}
          placeholder="관심사(문화, 쇼핑, 카페 방문)"
          {...register("interests", { required: true })}
        />
        {errors.interests && (
          <p className={styles.errorText}>관심사를 입력해주세요</p>
        )}

        <input
          type="text"
          className={`${styles.textInput} ${errors.season ? styles.inputError : ""}`}
          placeholder="계절(봄, 여름, 가을, 겨울)"
          {...register("season", { required: true })}
        />
        {errors.season && (
          <p className={styles.errorText}>계절을 입력해주세요</p>
        )}

        <input
          type="text"
          className={`${styles.textInput} ${errors.transportation ? styles.inputError : ""}`}
          placeholder="교통수단(비행기, 기차, 버스, 자동차, 자전거)"
          {...register("transportation", { required: true })}
        />
        {errors.transportation && (
          <p className={styles.errorText}>교통수단을 입력해주세요</p>
        )}

        <button
          type="submit"
          className={styles.searchButton}
          disabled={!isValid}
        >
          일정 만들기
        </button>
      </form>
    </div>
  );
}
