import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { ProductRepository } from '../../repositories/ProductRepository';
import { CategoryRepository } from '../../repositories/CategoryRepository';
import { Category, Product } from '../../types';
import { LoadingState } from '../../components/LoadingState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';

type Nav = NativeStackNavigationProp<AdminStackParamList>;
type RouteProps = RouteProp<AdminStackParamList, 'AdminEditProduct'>;

const PLACEHOLDER_IMAGE = `https://picsum.photos/seed/new-product-${Date.now()}/600/600`;

function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function arrayToLines(list: string[] | undefined): string {
  return (list ?? []).join('\n');
}

interface FormState {
  name: string;
  brand: string;
  categoryId: string;
  price: string;
  mrp: string;
  stock: string;
  imageUrl: string;
  description: string;
  benefits: string;
  ingredients: string;
  howToUse: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  brand: 'AP Pure Care',
  categoryId: '',
  price: '',
  mrp: '',
  stock: '',
  imageUrl: PLACEHOLDER_IMAGE,
  description: '',
  benefits: '',
  ingredients: '',
  howToUse: '',
};

export function AdminAddEditProductScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const isEditMode = !!(route.params && 'productId' in (route.params as object));
  const productId = isEditMode ? (route.params as { productId: string }).productId : undefined;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    (async () => {
      const categoryList = await CategoryRepository.getAll();
      setCategories(categoryList);

      if (isEditMode && productId) {
        const product = await ProductRepository.getById(productId);
        if (product) {
          setExistingProduct(product);
          setForm({
            name: product.name,
            brand: product.brand,
            categoryId: product.categoryId,
            price: String(product.price),
            mrp: String(product.mrp),
            stock: String(product.stock),
            imageUrl: product.images[0] ?? PLACEHOLDER_IMAGE,
            description: product.description,
            benefits: arrayToLines(product.benefits),
            ingredients: arrayToLines(product.ingredients),
            howToUse: arrayToLines(product.howToUse),
          });
        } else if (categoryList.length > 0) {
          setForm((prev) => ({ ...prev, categoryId: categoryList[0].id }));
        }
      } else if (categoryList.length > 0) {
        setForm((prev) => ({ ...prev, categoryId: categoryList[0].id }));
      }
      setLoading(false);
    })();
  }, [isEditMode, productId]);

  const updateField = <K extends keyof FormState>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = 'Product name is required.';
    if (!form.brand.trim()) nextErrors.brand = 'Brand is required.';
    if (!form.categoryId) nextErrors.categoryId = 'Please select a category.';

    const price = parseFloat(form.price);
    const mrp = parseFloat(form.mrp);
    const stock = parseFloat(form.stock);

    if (!form.price.trim() || Number.isNaN(price) || price < 0)
      nextErrors.price = 'Enter a valid selling price.';
    if (!form.mrp.trim() || Number.isNaN(mrp) || mrp < 0) nextErrors.mrp = 'Enter a valid MRP.';
    if (!Number.isNaN(price) && !Number.isNaN(mrp) && price > mrp) {
      nextErrors.price = 'Selling price cannot be greater than MRP.';
    }
    if (!form.stock.trim() || Number.isNaN(stock) || stock < 0)
      nextErrors.stock = 'Enter a valid stock quantity.';
    if (!form.description.trim()) nextErrors.description = 'Description is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const price = parseFloat(form.price) || 0;
      const mrp = parseFloat(form.mrp) || 0;
      const stock = parseFloat(form.stock) || 0;
      const discountPercent = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
      const images = [form.imageUrl.trim() || PLACEHOLDER_IMAGE];
      const benefits = linesToArray(form.benefits);
      const ingredients = linesToArray(form.ingredients);
      const howToUse = linesToArray(form.howToUse);

      if (isEditMode && existingProduct) {
        const updated: Product = {
          ...existingProduct,
          name: form.name.trim(),
          brand: form.brand.trim(),
          categoryId: form.categoryId,
          price,
          mrp,
          discountPercent,
          stock,
          images,
          description: form.description.trim(),
          benefits,
          ingredients,
          howToUse,
          variants: existingProduct.variants.length
            ? existingProduct.variants.map((v, index) =>
                index === 0 ? { ...v, price, mrp, stock } : v
              )
            : [{ id: `v-${Date.now()}`, label: 'Default', price, mrp, stock }],
        };
        await ProductRepository.updateProduct(updated);
      } else {
        const newProduct: Omit<Product, 'id'> = {
          name: form.name.trim(),
          brand: form.brand.trim(),
          categoryId: form.categoryId,
          concernIds: [],
          images,
          price,
          mrp,
          discountPercent,
          rating: 4.0,
          reviewCount: 0,
          description: form.description.trim(),
          benefits,
          ingredients,
          howToUse,
          productInfo: [],
          faqs: [],
          stock,
          variants: [{ id: `v-${Date.now()}`, label: 'Default', price, mrp, stock }],
          tags: [],
        };
        await ProductRepository.createProduct(newProduct);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <Header
          title={isEditMode ? 'Edit Product' : 'Add Product'}
          onBack={() => navigation.goBack()}
        />
        <LoadingState label="Loading product..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <Header
        title={isEditMode ? 'Edit Product' : 'Add Product'}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Field
            label="Product Name"
            value={form.name}
            onChangeText={(t) => updateField('name', t)}
            error={errors.name}
            placeholder="e.g. Ashwagandha Capsules"
          />
          <Field
            label="Brand"
            value={form.brand}
            onChangeText={(t) => updateField('brand', t)}
            error={errors.brand}
            placeholder="e.g. AP Pure Care"
          />

          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => updateField('categoryId', cat.id)}
                  style={[styles.chip, form.categoryId === cat.id && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipLabel, form.categoryId === cat.id && styles.chipLabelActive]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId}</Text>}
          </View>

          <View style={styles.row}>
            <Field
              label="Selling Price (₹)"
              value={form.price}
              onChangeText={(t) => updateField('price', t)}
              error={errors.price}
              keyboardType="numeric"
              style={styles.halfField}
              placeholder="449"
            />
            <Field
              label="MRP (₹)"
              value={form.mrp}
              onChangeText={(t) => updateField('mrp', t)}
              error={errors.mrp}
              keyboardType="numeric"
              style={styles.halfField}
              placeholder="599"
            />
          </View>

          <Field
            label="Stock Quantity"
            value={form.stock}
            onChangeText={(t) => updateField('stock', t)}
            error={errors.stock}
            keyboardType="numeric"
            placeholder="120"
          />
          <Field
            label="Image URL"
            value={form.imageUrl}
            onChangeText={(t) => updateField('imageUrl', t)}
            placeholder="https://..."
          />
          <Field
            label="Description"
            value={form.description}
            onChangeText={(t) => updateField('description', t)}
            error={errors.description}
            placeholder="Describe the product..."
            multiline
          />
          <Field
            label="Benefits (one per line)"
            value={form.benefits}
            onChangeText={(t) => updateField('benefits', t)}
            placeholder={'Supports immunity\nBoosts energy'}
            multiline
          />
          <Field
            label="Ingredients (one per line)"
            value={form.ingredients}
            onChangeText={(t) => updateField('ingredients', t)}
            placeholder={'Ashwagandha Root Extract\nVegetable Capsule'}
            multiline
          />
          <Field
            label="How to Use (one per line)"
            value={form.howToUse}
            onChangeText={(t) => updateField('howToUse', t)}
            placeholder={'Take 1 capsule twice daily'}
            multiline
          />

          <View style={styles.footerActions}>
            <SecondaryButton
              label="Cancel"
              onPress={() => navigation.goBack()}
              style={styles.footerBtn}
            />
            <PrimaryButton
              label={isEditMode ? 'Save Changes' : 'Add Product'}
              onPress={handleSave}
              loading={saving}
              style={styles.footerBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={styles.iconBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={24} color={colors.textInverse} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.iconBtn} />
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType,
  multiline,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline, error && styles.inputError]}
        accessibilityLabel={label}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.adminBg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.adminSidebar,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h4, color: colors.textInverse },
  scrollContent: { padding: spacing.md, gap: spacing.sm },
  field: { marginBottom: spacing.sm, gap: spacing.xxs },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfField: { flex: 1 },
  label: { ...typography.captionMedium, color: colors.textPrimary },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },
  errorText: { ...typography.caption, color: colors.danger },
  chipsRow: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.xs,
  },
  chipActive: { backgroundColor: colors.adminAccent, borderColor: colors.adminAccent },
  chipLabel: { ...typography.caption, color: colors.textSecondary },
  chipLabelActive: { color: colors.textOnPrimary, fontWeight: '700' },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  footerBtn: { flex: 1 },
});
