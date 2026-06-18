import { Button } from '@components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { pocNamespaces, type Status } from '@poc/poc-resources';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type StatusFormValues = Pick<Status, 'name' | 'displayName' | 'externalDisplayName' | 'namespace'>;

export function StatusForm({ initial, isNew = true }: { initial?: Partial<Status>; isNew?: boolean }) {
  const router = useRouter();
  const form = useForm<StatusFormValues>({
    defaultValues: {
      name: initial?.name ?? '',
      displayName: initial?.displayName ?? '',
      externalDisplayName: initial?.externalDisplayName ?? '',
      namespace: initial?.namespace ?? '',
    },
  });

  const onSubmit = (values: StatusFormValues) => {
    toast.success(`${isNew ? 'Skapade' : 'Sparade'} status "${values.name}" (PoC – inget sparas på riktigt).`);
    router.push('/poc/statuses');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-6">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: 'Namn är obligatoriskt' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Namn *</FormLabel>
              <FormControl>
                <Input {...field} disabled={!isNew} placeholder="t.ex. ONGOING" />
              </FormControl>
              <FormDescription>Tekniskt namn. Kan inte ändras efter skapande.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visningsnamn</FormLabel>
              <FormControl>
                <Input {...field} placeholder="t.ex. Pågående" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="externalDisplayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Externt visningsnamn</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Visas för medborgaren" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="namespace"
          rules={{ required: 'Välj ett namespace' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Namespace *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!isNew}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj ett alternativ" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {pocNamespaces.map((ns) => (
                    <SelectItem key={ns.namespace} value={ns.namespace}>
                      {ns.displayName} ({ns.namespace})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit">{isNew ? 'Skapa status' : 'Spara ändringar'}</Button>
          <Button type="button" variant="outline" onClick={() => router.push('/poc/statuses')}>
            Avbryt
          </Button>
        </div>
      </form>
    </Form>
  );
}
