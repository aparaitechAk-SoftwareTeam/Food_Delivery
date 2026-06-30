import React from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const FoodSection = ({
  title,
  subtitle,
  items = [],
  renderItem,
  onViewAll,
  icon,
}) => {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.titleWrapper}>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color="#FF6F61"
              style={{ marginRight: 6 }}
            />
          )}
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>

        {onViewAll && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={onViewAll}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#FF6F61" />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal List */}
      <FlatList
        data={items}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id || item._id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1D2939",
  },
  subtitle: {
    fontSize: 11,
    color: "#667085",
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF6F61",
    marginRight: 2,
  },
  listContent: {
    paddingHorizontal: 8,
  },
});

export default FoodSection;
