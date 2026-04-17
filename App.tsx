import "react-native-gesture-handler";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BarChart } from "react-native-chart-kit";
import React, { useEffect, useMemo, useState } from "react";
import {
	Dimensions,
	I18nManager,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
	CATEGORIES,
	CATEGORY_URDU_LABELS,
	COLORS,
	UNITS,
} from "./src/constants";
import { useKharchaStore } from "./src/store";
import { Category, GrocerySeedItem, Unit } from "./src/types";
import { categoryTotals, itemSubtotal, money } from "./src/utils";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const { width } = Dimensions.get("window");
const parseNullableNumber = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}
	const parsed = Number(trimmed);
	return Number.isNaN(parsed) ? null : parsed;
};

const UNIT_LABELS: Record<Unit, string> = {
	kg: "Kg",
	g: "G",
	ltr: "Ltr",
	pcs: "Pcs",
	pack: "Pack",
	bottle: "Bottle",
	jar: "Jar",
	loaf: "Loaf",
	tube: "Tube",
};

const formatUnitLabel = (unit: Unit) => UNIT_LABELS[unit] ?? unit;

type AppModalState = {
	visible: boolean;
	title: string;
	message: string;
};

const defaultModalState: AppModalState = {
	visible: false,
	title: "",
	message: "",
};

function ThemedAlertModal({
	state,
	onClose,
}: {
	state: AppModalState;
	onClose: () => void;
}) {
	return (
		<Modal
			transparent
			visible={state.visible}
			animationType="fade"
			onRequestClose={onClose}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.modalCard}>
					<Text style={styles.modalTitle}>{state.title}</Text>
					<Text style={styles.modalMessage}>{state.message}</Text>
					<Pressable style={styles.modalButton} onPress={onClose}>
						<Text style={styles.modalButtonText}>OK</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);
}

type ItemFormState = GrocerySeedItem;

const emptyItem: ItemFormState = {
	urduName: "",
	englishName: "",
	category: "Kitchen",
	unit: "kg",
	quantity: null,
	unitPrice: null,
};

function GroceryListScreen({ navigation }: { navigation: any }) {
	const items = useKharchaStore((s) => s.items);
	const updateItem = useKharchaStore((s) => s.updateItem);
	const [activeCategory, setActiveCategory] = useState<Category | "All">("All");

	const visibleItems = useMemo(() => {
		return items.filter((item) =>
			activeCategory === "All" ? true : item.category === activeCategory,
		);
	}, [items, activeCategory]);

	const groupedItems = useMemo(() => {
		return visibleItems.reduce<Record<string, typeof visibleItems>>(
			(acc, item) => {
				if (!acc[item.category]) {
					acc[item.category] = [];
				}
				acc[item.category].push(item);
				return acc;
			},
			{},
		);
	}, [visibleItems]);

	return (
		<SafeAreaView style={styles.screen} edges={["top"]}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.categoryScroll}
			>
				{["All", ...CATEGORIES].map((category) => (
					<Pressable
						key={category}
						style={[
							styles.categoryChip,
							activeCategory === category && styles.categoryChipActive,
						]}
						onPress={() => setActiveCategory(category as Category | "All")}
					>
						<View
							style={[
								styles.categoryDot,
								activeCategory === category && styles.categoryDotActive,
							]}
						/>
						<View>
							<Text
								style={[
									styles.categoryChipText,
									activeCategory === category && styles.categoryChipTextActive,
								]}
							>
								{category}
							</Text>
							{category !== "All" && (
								<Text
									style={[
										styles.categoryChipSubText,
										activeCategory === category &&
											styles.categoryChipSubTextActive,
									]}
								>
									{CATEGORY_URDU_LABELS[category as Category]}
								</Text>
							)}
						</View>
						{category !== "All" && (
							<View
								style={[
									styles.categoryCountPill,
									activeCategory === category && styles.categoryCountPillActive,
								]}
							>
								<Text
									style={[
										styles.categoryCountPillText,
										activeCategory === category &&
											styles.categoryCountPillTextActive,
									]}
								>
									{items.filter((item) => item.category === category).length}
								</Text>
							</View>
						)}
					</Pressable>
				))}
			</ScrollView>

			<ScrollView contentContainerStyle={styles.listContent}>
				{Object.entries(groupedItems).map(([category, categoryItems]) => (
					<View key={category} style={styles.categorySection}>
						<View style={styles.categoryHeaderRow}>
							<View style={{ flex: 1 }}>
								<Text style={styles.categoryHeader}>{category}</Text>
								<Text style={styles.categoryHeaderUrdu}>
									{CATEGORY_URDU_LABELS[category as Category]}
								</Text>
							</View>
							<Text style={styles.categoryCount}>
								{categoryItems.length} items
							</Text>
						</View>

						{categoryItems.map((item) => (
							<Pressable
								key={item.id}
								style={[
									styles.itemCard,
									item.purchased && styles.itemCardPurchased,
								]}
								onPress={() =>
									navigation.navigate("ItemForm", { itemId: item.id })
								}
							>
								<View style={styles.itemTopRow}>
									<View style={{ flex: 1 }}>
										<Text style={styles.englishName}>{item.englishName}</Text>
										<Text style={styles.urduName}>{item.urduName}</Text>
									</View>
									<Switch
										value={item.quantity !== null && item.quantity > 0}
										onValueChange={(value) =>
											updateItem(item.id, {
												quantity: value ? (item.quantity ?? 1) : null,
												purchased: value ? item.purchased : false,
											})
										}
									/>
								</View>

								<View style={styles.unitBadge}>
									<Text style={styles.unitText}>
										{formatUnitLabel(item.unit)}
									</Text>
								</View>

								<View style={styles.inputRow}>
									<View style={styles.inputGroup}>
										<Text style={styles.inputLabel}>Qty</Text>
										<TextInput
											style={styles.input}
											keyboardType="numeric"
											value={
												item.quantity === null ? "" : String(item.quantity)
											}
											onChangeText={(value) =>
												updateItem(item.id, {
													quantity: parseNullableNumber(value),
												})
											}
											placeholder={`Enter ${item.unit}`}
										/>
									</View>
									<View style={styles.inputGroup}>
										<Text style={styles.inputLabel}>Unit Price</Text>
										<TextInput
											style={styles.input}
											keyboardType="numeric"
											value={
												item.unitPrice === null ? "" : String(item.unitPrice)
											}
											onChangeText={(value) =>
												updateItem(item.id, {
													unitPrice: parseNullableNumber(value),
												})
											}
											placeholder="Enter price"
										/>
									</View>
									<View style={styles.subtotalGroup}>
										<Text style={styles.inputLabel}>Subtotal</Text>
										<Text style={styles.subtotal}>
											{money(itemSubtotal(item))}
										</Text>
									</View>
								</View>
							</Pressable>
						))}
					</View>
				))}
			</ScrollView>

			<Pressable
				style={styles.primaryButton}
				onPress={() => navigation.navigate("ItemForm")}
			>
				<View style={styles.buttonInline}>
					<Ionicons name="add-circle-outline" size={18} color="#fff" />
					<Text style={styles.primaryButtonText}>Add Item</Text>
				</View>
			</Pressable>
		</SafeAreaView>
	);
}

function BudgetScreen() {
	const items = useKharchaStore((s) => s.items);
	const monthlyBudget = useKharchaStore((s) => s.monthlyBudget);
	const setMonthlyBudget = useKharchaStore((s) => s.setMonthlyBudget);

	const spent = items
		.filter((item) => item.purchased)
		.reduce((sum, item) => sum + itemSubtotal(item), 0);
	const remaining = monthlyBudget - spent;
	const spendPercent = monthlyBudget
		? Math.min(100, (spent / monthlyBudget) * 100)
		: 0;
	const byCategory = categoryTotals(items);
	const labels = Object.keys(byCategory);
	const values = Object.values(byCategory);

	return (
		<SafeAreaView style={styles.screen} edges={["top"]}>
			<ScrollView contentContainerStyle={styles.listContent}>
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Monthly Budget</Text>
					<TextInput
						style={styles.budgetInput}
						keyboardType="numeric"
						value={String(monthlyBudget)}
						onChangeText={(value) => setMonthlyBudget(Number(value || 0))}
						placeholder="Budget in PKR"
					/>
					<Text style={styles.summaryText}>Spent: {money(spent)}</Text>
					<Text style={styles.summaryText}>Remaining: {money(remaining)}</Text>
					<View style={styles.progressTrack}>
						<View
							style={[styles.progressFill, { width: `${spendPercent}%` }]}
						/>
					</View>
					<Text style={styles.metaText}>
						{spendPercent.toFixed(1)}% of budget used
					</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Category Breakdown</Text>
					{labels.length > 0 ? (
						<BarChart
							data={{
								labels: labels.slice(0, 6),
								datasets: [{ data: values.slice(0, 6) }],
							}}
							width={width - 64}
							height={220}
							yAxisLabel="Rs "
							yAxisSuffix=""
							fromZero
							chartConfig={{
								backgroundGradientFrom: "#ffffff",
								backgroundGradientTo: "#ffffff",
								color: (opacity = 1) => `rgba(47,133,90,${opacity})`,
								labelColor: () => COLORS.text,
							}}
							style={{ borderRadius: 12 }}
						/>
					) : (
						<Text style={styles.metaText}>
							Mark items as purchased to view charts.
						</Text>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function ShoppingScreen() {
	const items = useKharchaStore((s) => s.items);
	const updateItem = useKharchaStore((s) => s.updateItem);

	const selectedItems = useMemo(() => {
		return items
			.filter((item) => item.quantity !== null && item.quantity > 0)
			.sort((a, b) => {
				if (a.purchased === b.purchased) {
					return (
						a.category.localeCompare(b.category) ||
						a.englishName.localeCompare(b.englishName)
					);
				}
				return a.purchased ? 1 : -1;
			});
	}, [items]);

	const doneCount = selectedItems.filter((item) => item.purchased).length;
	const remainingCount = selectedItems.length - doneCount;

	return (
		<SafeAreaView style={styles.screen} edges={["top"]}>
			<ScrollView contentContainerStyle={styles.listContent}>
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Shopping Checklist</Text>
					<Text style={styles.summaryText}>
						Done: {doneCount} | Remaining: {remainingCount}
					</Text>
				</View>

				{selectedItems.length === 0 ? (
					<View style={styles.card}>
						<Text style={styles.metaText}>
							Add quantity in List tab to build your shopping checklist.
						</Text>
					</View>
				) : (
					selectedItems.map((item) => (
						<Pressable
							key={item.id}
							style={[
								styles.shoppingItemCard,
								item.purchased && styles.shoppingItemCardDone,
							]}
							onPress={() =>
								updateItem(item.id, { purchased: !item.purchased })
							}
						>
							<MaterialCommunityIcons
								name={
									item.purchased ? "checkbox-marked" : "checkbox-blank-outline"
								}
								size={24}
								color={item.purchased ? COLORS.primary : COLORS.muted}
							/>
							<View style={styles.shoppingItemContent}>
								<Text
									style={[
										styles.shoppingItemName,
										item.purchased && styles.shoppingItemNameDone,
									]}
								>
									{item.englishName}
								</Text>
								<Text style={styles.urduName}>{item.urduName}</Text>
								<Text style={styles.metaText}>
									Qty: {item.quantity} {formatUnitLabel(item.unit)} |{" "}
									{item.category}
								</Text>
							</View>
						</Pressable>
					))
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

function HistoryScreen() {
	const history = useKharchaStore((s) => s.history);
	const closeMonth = useKharchaStore((s) => s.closeMonth);
	const resetForNewMonth = useKharchaStore((s) => s.resetForNewMonth);
	const [modalState, setModalState] = useState<AppModalState>(defaultModalState);

	const showModal = (title: string, message: string) => {
		setModalState({ visible: true, title, message });
	};

	return (
		<SafeAreaView style={styles.screen} edges={["top"]}>
			<Pressable
				style={styles.primaryButton}
				onPress={() => {
					closeMonth();
					resetForNewMonth();
					showModal("Month Closed", "Snapshot saved to history.");
				}}
			>
				<View style={styles.buttonInline}>
					<MaterialCommunityIcons
						name="calendar-check-outline"
						size={18}
						color="#fff"
					/>
					<Text style={styles.primaryButtonText}>Close Month</Text>
				</View>
			</Pressable>

			<ScrollView contentContainerStyle={styles.listContent}>
				{history.map((entry) => (
					<View style={styles.itemCard} key={entry.id}>
						<Text style={styles.cardTitle}>{entry.monthLabel}</Text>
						<Text style={styles.summaryText}>
							Total: {money(entry.totalSpent)}
						</Text>
						<Text style={styles.metaText}>
							{new Date(entry.closedAt).toLocaleString()}
						</Text>
						{entry.items.slice(0, 5).map((item) => (
							<Text key={item.id} style={styles.metaText}>
								• {item.englishName} / {item.urduName} -{" "}
								{money(itemSubtotal(item))}
							</Text>
						))}
						{entry.items.length > 5 && (
							<Text style={styles.metaText}>...and more</Text>
						)}
					</View>
				))}
			</ScrollView>
			<ThemedAlertModal
				state={modalState}
				onClose={() => setModalState(defaultModalState)}
			/>
		</SafeAreaView>
	);
}

function SettingsScreen() {
	const history = useKharchaStore((s) => s.history);
	const [modalState, setModalState] = useState<AppModalState>(defaultModalState);

	const showModal = (title: string, message: string) => {
		setModalState({ visible: true, title, message });
	};

	const exportReport = async () => {
		if (!history.length) {
			showModal("No Data", "Close a month first to export a report.");
			return;
		}

		const latest = history[0];
		const header =
			"English Name,Urdu Name,Category,Unit,Quantity,Unit Price,Subtotal";
		const rows = latest.items.map((item) =>
			[
				item.englishName,
				item.urduName,
				item.category,
				item.unit,
				item.quantity,
				item.unitPrice,
				itemSubtotal(item).toFixed(0),
			].join(","),
		);

		const content = [
			`Month: ${latest.monthLabel}`,
			`Total: ${money(latest.totalSpent)}`,
			"",
			header,
			...rows,
		].join("\n");
		const path = `${FileSystem.cacheDirectory}kharcha-${latest.id}.csv`;
		await FileSystem.writeAsStringAsync(path, content, {
			encoding: FileSystem.EncodingType.UTF8,
		});
		await Sharing.shareAsync(path, {
			mimeType: "text/csv",
			dialogTitle: "Share Kharcha monthly report",
		});
	};

	return (
		<SafeAreaView style={styles.screen} edges={["top"]}>
			<ScrollView contentContainerStyle={styles.listContent}>
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Language & RTL</Text>
					<Text style={styles.metaText}>
						Urdu labels are right-aligned. Enable full RTL layout if needed.
					</Text>
					<Pressable
						style={styles.secondaryButton}
						onPress={() => {
							I18nManager.allowRTL(true);
							I18nManager.forceRTL(true);
							showModal(
								"RTL Enabled",
								"Restart app to apply full layout direction.",
							);
						}}
					>
						<Text style={styles.secondaryButtonText}>
							Enable Full RTL Layout
						</Text>
					</Pressable>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Export</Text>
					<Text style={styles.metaText}>Export last closed month as CSV.</Text>
					<Pressable style={styles.primaryButton} onPress={exportReport}>
						<View style={styles.buttonInline}>
							<Ionicons name="share-social-outline" size={18} color="#fff" />
							<Text style={styles.primaryButtonText}>
								Export Monthly Report
							</Text>
						</View>
					</Pressable>
				</View>
			</ScrollView>
			<ThemedAlertModal
				state={modalState}
				onClose={() => setModalState(defaultModalState)}
			/>
		</SafeAreaView>
	);
}

function ItemFormScreen({
	navigation,
	route,
}: {
	navigation: any;
	route: any;
}) {
	const addItem = useKharchaStore((s) => s.addItem);
	const items = useKharchaStore((s) => s.items);
	const updateItem = useKharchaStore((s) => s.updateItem);
	const [modalState, setModalState] = useState<AppModalState>(defaultModalState);
	const itemId = route?.params?.itemId as string | undefined;
	const existingItem = items.find((item) => item.id === itemId);
	const [form, setForm] = useState<ItemFormState>(
		existingItem
			? {
					urduName: existingItem.urduName,
					englishName: existingItem.englishName,
					category: existingItem.category,
					unit: existingItem.unit,
					quantity: existingItem.quantity,
					unitPrice: existingItem.unitPrice,
				}
			: emptyItem,
	);

	const save = () => {
		if (!form.englishName.trim() || !form.urduName.trim()) {
			setModalState({
				visible: true,
				title: "Required",
				message: "Please enter both Urdu and English names.",
			});
			return;
		}
		if (itemId) {
			updateItem(itemId, form);
		} else {
			addItem(form);
		}
		navigation.goBack();
	};

	return (
		<SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
			<ScrollView contentContainerStyle={styles.listContent}>
				<Text style={styles.fieldLabel}>English Name</Text>
				<TextInput
					style={styles.input}
					placeholder="English Name"
					value={form.englishName}
					onChangeText={(value) =>
						setForm((prev) => ({ ...prev, englishName: value }))
					}
				/>
				<Text style={styles.fieldLabel}>Urdu Name</Text>
				<TextInput
					style={[styles.input, styles.urduInput]}
					placeholder="اردو نام"
					value={form.urduName}
					onChangeText={(value) =>
						setForm((prev) => ({ ...prev, urduName: value }))
					}
				/>

				<Text style={styles.metaText}>Category</Text>
				<ScrollView horizontal showsHorizontalScrollIndicator={false}>
					{CATEGORIES.map((category) => (
						<Pressable
							key={category}
							style={[
								styles.chip,
								form.category === category && styles.chipActive,
							]}
							onPress={() => setForm((prev) => ({ ...prev, category }))}
						>
							<Text
								style={[
									styles.chipText,
									form.category === category && styles.chipTextActive,
								]}
							>
								{category}
							</Text>
						</Pressable>
					))}
				</ScrollView>

				<Text style={styles.metaText}>Unit</Text>
				<ScrollView horizontal showsHorizontalScrollIndicator={false}>
					{UNITS.map((unit) => (
						<Pressable
							key={unit}
							style={[styles.chip, form.unit === unit && styles.chipActive]}
							onPress={() =>
								setForm((prev) => ({ ...prev, unit: unit as Unit }))
							}
						>
							<Text
								style={[
									styles.chipText,
									form.unit === unit && styles.chipTextActive,
								]}
							>
								{unit}
							</Text>
						</Pressable>
					))}
				</ScrollView>

				<Text style={styles.fieldLabel}>Quantity</Text>
				<TextInput
					style={styles.input}
					keyboardType="numeric"
					placeholder="Quantity"
					value={form.quantity === null ? "" : String(form.quantity)}
					onChangeText={(value) =>
						setForm((prev) => ({
							...prev,
							quantity: parseNullableNumber(value),
						}))
					}
				/>
				<Text style={styles.fieldLabel}>Price Per Unit</Text>
				<TextInput
					style={styles.input}
					keyboardType="numeric"
					placeholder="Price Per Unit"
					value={form.unitPrice === null ? "" : String(form.unitPrice)}
					onChangeText={(value) =>
						setForm((prev) => ({
							...prev,
							unitPrice: parseNullableNumber(value),
						}))
					}
				/>
				<Pressable style={styles.primaryButton} onPress={save}>
					<Text style={styles.primaryButtonText}>
						{itemId ? "Update Item" : "Save Item"}
					</Text>
				</Pressable>
			</ScrollView>
			<ThemedAlertModal
				state={modalState}
				onClose={() => setModalState(defaultModalState)}
			/>
		</SafeAreaView>
	);
}

function Tabs() {
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarActiveTintColor: COLORS.primary,
				headerStyle: { backgroundColor: COLORS.primary },
				headerTintColor: "#fff",
				tabBarIcon: ({ color, size }) => {
					const iconByRoute: Record<string, keyof typeof Ionicons.glyphMap> = {
						List: "list-outline",
						Shopping: "cart-outline",
						Budget: "wallet-outline",
						History: "time-outline",
						Settings: "settings-outline",
					};
					return (
						<Ionicons
							name={iconByRoute[route.name] ?? "ellipse-outline"}
							size={size}
							color={color}
						/>
					);
				},
			})}
		>
			<Tab.Screen
				name="List"
				component={GroceryListScreen}
				options={{ headerTitle: "Pantry Planner", headerTitleAlign:"center" }}
			/>
			<Tab.Screen
				name="Shopping"
				component={ShoppingScreen}
				options={{ headerTitle: "Shopping Sprint", headerTitleAlign:"center"  }}
			/>
			<Tab.Screen
				name="Budget"
				component={BudgetScreen}
				options={{ headerTitle: "Budget Pulse", headerTitleAlign:"center"  }}
			/>
			<Tab.Screen
				name="History"
				component={HistoryScreen}
				options={{ headerTitle: "Monthly Memories", headerTitleAlign:"center"  }}
			/>
			<Tab.Screen
				name="Settings"
				component={SettingsScreen}
				options={{ headerTitle: "Kharcha Controls", headerTitleAlign:"center"  }}
			/>
		</Tab.Navigator>
	);
}

export default function App() {
	const initializeSeed = useKharchaStore((s) => s.initializeSeed);

	useEffect(() => {
		initializeSeed();
	}, [initializeSeed]);

	return (
		<SafeAreaProvider>
			<StatusBar style="light" />
			<NavigationContainer>
				<Stack.Navigator>
					<Stack.Screen
						name="Kharcha"
						component={Tabs}
						options={{ headerShown: false }}
					/>
					<Stack.Screen
						name="ItemForm"
						component={ItemFormScreen}
						options={{ title: "Add / Edit Item" }}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	listContent: {
		padding: 16,
		gap: 12,
	},
	categoryScroll: {
		maxHeight: 88,
		paddingHorizontal: 12,
    marginBottom: 10,
	},
	categoryChip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: "#fff",
		marginRight: 8,
		minHeight: 36,
		justifyContent: "space-between",
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	categoryChipActive: {
		backgroundColor: COLORS.primaryLight,
		borderColor: COLORS.primary,
	},
	categoryDot: {
		width: 8,
		height: 8,
		borderRadius: 999,
		backgroundColor: COLORS.border,
	},
	categoryDotActive: {
		backgroundColor: COLORS.primary,
	},
	categoryChipText: {
		color: COLORS.text,
		fontSize: 13,
		fontWeight: "700",
	},
	categoryChipTextActive: {
		color: COLORS.primary,
	},
	categoryChipSubText: {
		color: COLORS.muted,
		fontSize: 11,
		writingDirection: "rtl",
		textAlign: "right",
	},
	categoryChipSubTextActive: {
		color: COLORS.primary,
	},
	categoryCountPill: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 999,
		backgroundColor: COLORS.background,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	categoryCountPillActive: {
		backgroundColor: "#fff",
		borderColor: COLORS.primary,
	},
	categoryCountPillText: {
		color: COLORS.muted,
		fontSize: 11,
		fontWeight: "700",
	},
	categoryCountPillTextActive: {
		color: COLORS.primary,
	},
	chip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: "#fff",
		marginRight: 8,
		alignSelf: "flex-start",
		minHeight: 44,
		justifyContent: "center",
	},
	chipActive: {
		backgroundColor: COLORS.primary,
		borderColor: COLORS.primary,
	},
	chipText: {
		color: COLORS.text,
		fontSize: 13,
		fontWeight: "600",
	},
	chipSubText: {
		color: COLORS.muted,
		fontSize: 11,
		writingDirection: "rtl",
		textAlign: "right",
	},
	categorySection: {
		gap: 8,
	},
	categoryHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 4,
	},
	categoryHeader: {
		color: COLORS.text,
		fontWeight: "700",
		fontSize: 16,
	},
	categoryHeaderUrdu: {
		color: COLORS.muted,
		fontSize: 13,
		writingDirection: "rtl",
		textAlign: "right",
	},
	categoryCount: {
		color: COLORS.muted,
		fontSize: 12,
		fontWeight: "600",
	},
	chipTextActive: {
		color: "#fff",
	},
	unitBadge: {
		alignSelf: "flex-start",
		backgroundColor: COLORS.primaryLight,
		borderColor: COLORS.border,
		borderWidth: 1,
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 3,
	},
	unitText: {
		color: COLORS.primary,
		fontWeight: "800",
		fontSize: 12,
	},
	itemCard: {
		backgroundColor: COLORS.card,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: COLORS.border,
		padding: 12,
		gap: 8,
	},
	itemCardPurchased: {
		borderColor: COLORS.primary,
		backgroundColor: COLORS.primaryLight,
	},
	shoppingItemCard: {
		backgroundColor: COLORS.card,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: COLORS.border,
		padding: 12,
		gap: 10,
		flexDirection: "row",
		alignItems: "flex-start",
	},
	shoppingItemCardDone: {
		backgroundColor: COLORS.primaryLight,
		borderColor: COLORS.primary,
	},
	shoppingItemContent: {
		flex: 1,
		gap: 4,
	},
	shoppingItemName: {
		color: COLORS.text,
		fontSize: 18,
		fontWeight: "700",
	},
	shoppingItemNameDone: {
		textDecorationLine: "line-through",
		color: COLORS.muted,
	},
	itemTopRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 10,
	},
	englishName: {
		color: COLORS.text,
		fontSize: 18,
		fontWeight: "800",
	},
	urduName: {
		color: COLORS.muted,
		fontSize: 15,
		fontWeight: "600",
		writingDirection: "rtl",
		textAlign: "right",
	},
	metaText: {
		color: COLORS.muted,
		fontSize: 14,
	},
	inputRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 8,
	},
	inputGroup: {
		flex: 1,
		gap: 4,
	},
	subtotalGroup: {
		minWidth: 96,
		gap: 4,
		alignItems: "flex-end",
	},
	inputLabel: {
		color: COLORS.muted,
		fontSize: 11,
		fontWeight: "600",
	},
	fieldLabel: {
		color: COLORS.text,
		fontSize: 13,
		fontWeight: "600",
		marginBottom: -6,
	},
	input: {
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		color: COLORS.text,
		flex: 1,
	},
	urduInput: {
		writingDirection: "rtl",
		textAlign: "right",
		fontWeight: "700",
	},
	subtotal: {
		minWidth: 88,
		textAlign: "right",
		fontWeight: "700",
		color: COLORS.primary,
	},
	primaryButton: {
		backgroundColor: COLORS.primary,
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: "center",
		margin: 16,
	},
	primaryButtonText: {
		color: "#fff",
		fontWeight: "700",
	},
	buttonInline: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	secondaryButton: {
		borderColor: COLORS.primary,
		borderWidth: 1,
		borderRadius: 12,
		paddingVertical: 10,
		paddingHorizontal: 14,
		marginTop: 12,
		alignItems: "center",
	},
	secondaryButtonText: {
		color: COLORS.primary,
		fontWeight: "600",
	},
	card: {
		backgroundColor: COLORS.card,
		borderColor: COLORS.border,
		borderWidth: 1,
		borderRadius: 12,
		padding: 14,
		gap: 8,
	},
	cardTitle: {
		color: COLORS.text,
		fontSize: 16,
		fontWeight: "700",
	},
	budgetInput: {
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		color: COLORS.text,
	},
	summaryText: {
		color: COLORS.text,
		fontSize: 14,
	},
	progressTrack: {
		backgroundColor: COLORS.primaryLight,
		height: 10,
		borderRadius: 999,
		overflow: "hidden",
	},
	progressFill: {
		backgroundColor: COLORS.primary,
		height: "100%",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(15, 23, 42, 0.45)",
		justifyContent: "center",
		paddingHorizontal: 20,
	},
	modalCard: {
		backgroundColor: COLORS.card,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: COLORS.border,
		padding: 18,
		gap: 12,
	},
	modalTitle: {
		color: COLORS.text,
		fontSize: 18,
		fontWeight: "800",
	},
	modalMessage: {
		color: COLORS.muted,
		fontSize: 14,
		lineHeight: 20,
	},
	modalButton: {
		alignSelf: "flex-end",
		backgroundColor: COLORS.primary,
		borderRadius: 10,
		paddingHorizontal: 18,
		paddingVertical: 10,
	},
	modalButtonText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 14,
	},
});
