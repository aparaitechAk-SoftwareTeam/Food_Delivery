import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, Platform } from "react-native";
import { Text } from "react-native-paper";

const { width } = Dimensions.get("window");
const CAROUSEL_WIDTH = width - 32;

const BannerCarousel = ({ banners = [], onBannerPress }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const autoPlayTimerRef = useRef(null);

  const data = banners;

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [data]);

  const startAutoPlay = () => {
    stopAutoPlay();
    if (data.length <= 1) return;
    autoPlayTimerRef.current = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= data.length) {
        nextIndex = 0;
      }
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 4000);
  };

  const stopAutoPlay = () => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }
  };

  const getItemLayout = (data, index) => ({
    length: CAROUSEL_WIDTH + 16,
    offset: (CAROUSEL_WIDTH + 16) * index,
    index,
  });

  const onScrollToIndexFailed = (info) => {
    const wait = new Promise((resolve) => setTimeout(resolve, 50));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
    });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.bannerContainer}
        onPress={() => onBannerPress && onBannerPress(item)}
        activeOpacity={0.9}
        onPressIn={stopAutoPlay}
        onPressOut={startAutoPlay}
      >
        <Image source={{ uri: item.image }} style={styles.bannerImage} resizeMode="cover" />
        <View style={styles.overlay} />
        <View style={styles.textContainer}>
          <Text style={styles.bannerTitle}>{item.title}</Text>
          <Text style={styles.bannerDesc}>{item.description}</Text>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>Order Now</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CAROUSEL_WIDTH + 16}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.flatListContent}
        keyExtractor={(item) => item.id || item._id}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={onScrollToIndexFailed}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews={Platform.OS === "android"}
      />
      {/* Pagination indicators */}
      <View style={styles.paginationRow}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  flatListContent: {
    paddingHorizontal: 8,
  },
  bannerContainer: {
    width: CAROUSEL_WIDTH,
    height: 156,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 8,
    backgroundColor: "#F8F9FA",
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  textContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  bannerDesc: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    marginBottom: 8,
  },
  ctaButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FF6F61",
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 18,
    backgroundColor: "#FF6F61",
  },
  dotInactive: {
    width: 6,
    backgroundColor: "#D0D5DD",
  },
});

export default BannerCarousel;
